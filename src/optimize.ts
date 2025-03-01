import type { Options } from './config-types.js';
import { globby } from 'globby';
import * as path from 'path';
import * as fsp from 'fs/promises';
import { UrlTransformer, getCanonicalCdnForUrl, getTransformer } from 'unpic';
import * as cheerio from '@divriots/cheerio';
import { isNumeric } from './utils.js';
import {
  Image,
  compressImage,
  ImageMimeType,
  ImageOutputOptions,
} from './compressors/images.js';
import svgToMiniDataURI from 'mini-svg-data-uri';
import kleur from 'kleur';
import ora from 'ora';
import { isLocal, Resource, translateSrc } from './utils/resource.js';
import { downloadExternalImage } from './optimizers/img-external.js';
import { inlineCriticalCss } from './optimizers/inline-critical-css.js';
import { prefetch_links_in_viewport } from './optimizers/prefetch-links.js';
import { GlobalState } from './state.js';
import { processIframe } from './optimizers/process-iframe.js';
import { processVideo } from './optimizers/process-video.js';

const UNPIC_DEFAULT_HOST_REGEX = /^https:\/\/n\//g;
const ABOVE_FOLD_DATA_ATTR = 'data-abovethefold';

function getIntAttr(
  img: cheerio.Cheerio<cheerio.Element>,
  attr: string
): number | undefined {
  const stringValue = img.attr(attr);
  if (!stringValue) return;
  const parsed = parseInt(stringValue);
  if (isNaN(parsed)) return;
  return parsed;
}

async function analyse(state: GlobalState, file: string): Promise<void> {
  console.log('▶ ' + file);

  // For processes to add into
  const appendToBody: Record<string, string> = {};

  const fs = state.vfs ?? fsp;
  const html = (await fs.readFile(path.join(state.dir, file))).toString();
  if (!html.includes('<html')) return;
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true });

  const theFold = getTheFold($);

  await processTag(
    state,
    file,
    $,
    'img',
    'src',
    processImage,
    theFold,
    appendToBody
  );
  await processTag(
    state,
    file,
    $,
    'iframe',
    'src',
    processIframe,
    theFold,
    appendToBody
  );
  await processTag(
    state,
    file,
    $,
    'video',
    'src',
    processVideo,
    theFold,
    appendToBody
  );
  await processTag(
    state,
    file,
    $,
    'meta[property$=":image"], meta[name$=":image"]' as 'meta',
    'content',
    processMetaImage,
    theFold,
    appendToBody
  );

  // Remove the fold
  //
  if (theFold) {
    $('the-fold').remove();
  }

  // Add to <head>
  //
  let prependToHead = '';
  let appendToHead = '';
  const heads = $('head'); // always exists because doc loaded with isDocument=true (default)
  const charsetElements$ = heads.find('meta[charset]');
  const wasCharsetFirst = !charsetElements$.prev().length;

  const { options } = state;
  if (options.html.add_css_reset_as === 'inline') {
    prependToHead += `<style>:where(img){height:auto;}</style>`;
  }
  if (prependToHead || appendToHead) {
    if (prependToHead) heads.prepend(prependToHead);
    if (appendToHead) heads.append(appendToHead);
  }

  switch (charsetElements$.length) {
    case 0:
      state.reportIssue(file, {
        type: 'fix',
        msg: 'Adding missing <meta charset="utf-8"> to the top of the <head>',
      });
      heads.prepend('<meta charset="utf-8">');
      break;
    case 1:
      if (!wasCharsetFirst) {
        state.reportIssue(file, {
          type: 'perf',
          msg: 'Moving <meta charset> to the top of the <head>',
        });
      }
      if (!wasCharsetFirst || prependToHead) heads.prepend(charsetElements$);
      break;
    default:
      state.reportIssue(file, {
        type: 'fix',
        msg: 'Multiple <meta charset> found in the <head>: taking only the first one and deleting the others',
      });
      charsetElements$.remove();
      heads.prepend(charsetElements$.first());
  }

  // Add to <body>
  //

  if (options.misc.prefetch_links === 'in-viewport') {
    await prefetch_links_in_viewport(state, file, appendToBody);
  }

  // Custom code
  const keys_to_install = Object.keys(appendToBody);
  if (keys_to_install.length > 0) {
    const body = $('body');
    if (body.length > 0) {
      keys_to_install.forEach((key) => body.append(appendToBody[key]));
    }
  }

  // Render HTML
  //
  let htmlResult = $.html();

  // Inline critical css
  //
  if (options.css.inline_critical_css) {
    try {
      htmlResult = await inlineCriticalCss(state.dir, htmlResult);
    } catch (e) {
      console.warn('Fail to inline critical CSS', e);
    }
  }

  if (!state.args.nowrite) {
    await fs.writeFile(path.join(state.dir, file), htmlResult);
  }
}

function isElementAboveTheFold(
  cheerio: cheerio.Cheerio<cheerio.Element>,
  element: cheerio.Element,
  theFold: number
) {
  const aboveTheFoldAttr: string | number | undefined =
    cheerio.attr(ABOVE_FOLD_DATA_ATTR);
  if (aboveTheFoldAttr) {
    const parsed = parseInt(aboveTheFoldAttr);
    if (!Number.isNaN(parsed)) return !!parsed;
  }
  return element.startIndex! < theFold;
}

function getTheFold($: cheerio.CheerioAPI): number {
  const theFolds = $('the-fold');

  // If you have the-fold
  if (theFolds[0]) {
    // Pickup the position of the last `<the-fold>`
    // @ts-ignore
    return theFolds[theFolds.length - 1].startIndex;
  }

  const theMains = $('main');

  // If you have main
  if (theMains[0]) {
    // @ts-ignore
    return theMains[0].startIndex + 5000;
  }

  const theBodys = $('body');
  // If you have main
  if (theBodys[0]) {
    // Pickup the position of the last `<the-fold>`
    // @ts-ignore
    return theBodys[0].startIndex + 10000;
  }

  return 0;
}

async function processImage(
  state: GlobalState,
  htmlfile: string,
  img: cheerio.Cheerio<cheerio.Element>,
  isAboveTheFold: boolean
): Promise<void> {
  /*
   * Attribute 'src'
   */
  let attrib_src = img.attr('src');

  if (!attrib_src) {
    const attrib_data_src = img.attr('data-src');
    if (attrib_data_src) {
      // Contains attribute [data-src]
      // Most likely, this is a Javascript lazy-loaded image
      // Let's not mess with it and hope it's well done
      return; // No warnings
    }

    state.reportIssue(htmlfile, {
      type: 'warn',
      msg: `Missing [src] on img - processing skipped.`,
    });
    return;
  }

  const fullSizeRaw = img.attr('data-fullsize');
  if (typeof fullSizeRaw !== undefined) img.removeAttr('data-fullsize');
  const fullSize = !!fullSizeRaw && parseInt(fullSizeRaw) > 0;

  const config = state.options;

  if (
    !isIncluded(attrib_src, config.image.src_include, config.image.src_exclude)
  ) {
    // Setup to ignore
    return;
  }

  /*
   * Attribute 'alt'
   */
  const attrib_alt = img.attr('alt');
  if (attrib_alt === undefined) {
    state.reportIssue(htmlfile, {
      type: 'a11y',
      msg: `Missing [alt] on img src="${attrib_src}" - Adding alt="" meanwhile.`,
    });
    img.attr('alt', '');
  }

  if (attrib_src.startsWith('data:')) {
    // Data URI image
    // TODO: try to compress it
    return;
  }

  /*
   * Attribute 'loading'
   */
  const attr_loading = img.attr('loading');
  if (isAboveTheFold) {
    img.removeAttr('loading');
    img.attr('fetchpriority', 'high');
  } else {
    switch (attr_loading) {
      case undefined:
        // Go lazy by default
        img.attr('loading', 'lazy');
        break;
      case 'eager':
        img.removeAttr('loading');
        break;
      case 'lazy':
        // Don't touch it
        break;
      default:
        state.reportIssue(htmlfile, {
          type: 'invalid',
          msg: `Invalid [loading]="${attr_loading}" on img src="${attrib_src}"`,
        });
    }
  }

  /*
   * Attribute 'decoding'
   */
  img.attr('decoding', 'async');

  /*
   * Check for external images
   */

  const { external } = state.options.image;
  if (isExternalImage(attrib_src, external)) {
    if (external.process === 'off')
      // Don't process external images
      return;
    try {
      const external_src = await externalImage(attrib_src, state, htmlfile);
      if (external_src) img.attr('src', (attrib_src = external_src));
    } catch (e: any) {
      return state.reportIssue(htmlfile, {
        type: 'warn',
        msg: `Failed to process external image: ${attrib_src} - ${e.message}`,
      }); // No more processing
    }
  }

  switch (config.image.cdn.process) {
    case 'off':
      break;
    case 'optimize':
      let cdnTransformer = config.image.cdn.transformer;
      if (cdnTransformer && !config.image.cdn.src_include) {
        throw new Error(
          'config.image.cdn.src_include is required when specifying a config.image.cdn.transformer'
        );
      }

      if (!cdnTransformer) {
        const canonical = getCanonicalCdnForUrl(attrib_src);
        if (!canonical) break;
        cdnTransformer = getTransformer(canonical.cdn);
      }
      if (!cdnTransformer) break;
      if (
        !isIncluded(
          attrib_src,
          config.image.cdn.src_include || /.*/,
          config.image.cdn.src_exclude
        )
      )
        break;
      if (fullSize) return;
      let attrib_width = getIntAttr(img, 'width');
      if (!attrib_width) {
        state.reportIssue(htmlfile, {
          type: 'warn',
          msg: `Missing or malformed'width' attribute for image ${attrib_src}, unable to perform CDN transform`,
        });
        return;
      }
      let attrib_height = getIntAttr(img, 'height');
      if (!attrib_height) {
        state.reportIssue(htmlfile, {
          type: 'warn',
          msg: `Missing or malformed 'height' attribute for image ${attrib_src}, unable to perform CDN transform`,
        });
        return;
      }
      const new_srcset = await generateSrcSetForCdn(
        state,
        attrib_src,
        cdnTransformer,
        attrib_width,
        attrib_height
      );

      if (new_srcset !== null) {
        img.attr('srcset', new_srcset);
      }

      // Add sizes attribute if not specified
      if (img.attr('srcset') && !img.attr('sizes')) {
        img.attr('sizes', '100vw');
      }
      return;
  }

  /*
   * Loading image
   */
  const originalImage = await Resource.loadResource(
    state,
    htmlfile,
    attrib_src
  );

  // No file -> give up
  if (!originalImage) {
    state.reportIssue(htmlfile, {
      type: 'erro',
      msg: `Can't find img on disk src="${attrib_src}"`,
    });
    return;
  }

  /*
   * Compress image
   */
  let newImage: Image | undefined;

  const isInPicture: boolean = img.parent()?.is('picture');

  let srcToFormat: 'webp' | 'avif' | 'jpeg' | 'unchanged' = 'unchanged';

  if (isInPicture) {
    // srcToFormat should not change if in picture
  } else {
    // Let's go to avif -> avif , webp -> webp, else * -> webp
    srcToFormat =
      (await originalImage.getMime()) === 'image/avif' ||
      (await originalImage.getMime()) === 'image/webp'
        ? 'unchanged'
        : 'webp';
  }

  if (config.image.compress) {
    newImage = await compressImage(state, await originalImage.getData(), {
      toFormat: srcToFormat,
      resize: { width: config.image.srcset_max_width },
    });
  }

  if (newImage?.data && newImage.data.length < (await originalImage.getLen())) {
    const newFilename = path.join(
      path.dirname(originalImage.filePathAbsolute),
      path.basename(
        originalImage.filePathAbsolute,
        path.extname(originalImage.filePathAbsolute)
      ) + `.${newImage.format}`
    );
    const newSrc = path.join(
      path.dirname(attrib_src),
      path.basename(attrib_src, path.extname(attrib_src)) +
        `.${newImage.format}`
    );

    if (!state.compressedFiles.has(newFilename) && !state.args.nowrite) {
      await (state.vfs ?? fsp).writeFile(newFilename, newImage.data);
    }

    // Mark new file as compressed
    state.compressedFiles.add(newFilename);

    // Report compression result
    state.reportSummary({
      action:
        newFilename !== originalImage.filePathAbsolute
          ? `${await originalImage.getExt()}->${newImage.format}`
          : path.extname(originalImage.filePathAbsolute),
      originalSize: await originalImage.getLen(),
      compressedSize: newImage.data.length,
    });

    img.attr('src', newSrc);
  } else {
    // Drop new Image
    newImage = undefined;

    // Report non-compression
    state.reportSummary({
      action: path.extname(originalImage.filePathAbsolute),
      originalSize: await originalImage.getLen(),
      compressedSize: await originalImage.getLen(),
    });
  }

  /*
   * Embed small images
   * Only above the fold
   */
  let isEmbed = false;

  if (isAboveTheFold) {
    let imageToEmbed: Image | undefined = newImage;

    // If new image was not generated then take the old image
    if (!imageToEmbed) {
      imageToEmbed = {
        data: await originalImage.getData(),
        format: await originalImage.getImageFormat(),
      };
    }

    // Only embed small images
    // matching the embed size
    if (imageToEmbed.data.length <= config.image.embed_size) {
      let datauri: string | undefined = undefined;

      const ifmt = imageToEmbed.format;
      switch (ifmt) {
        case 'svg':
          // When embedded, if the SVG file has width and height attributes (or viewBox without corresponding width/height),
          // the browser respects those attributes over the external <img> tag attributes.
          // TODO update the SVG - meanwhile don't embed it if there are attributes
          if (img.attr('width') || img.attr('height')) break;
          datauri = svgToMiniDataURI(imageToEmbed.data.toString());
          break;
        case 'webp':
        case 'jpg':
        case 'png':
          datauri = `data:image/${
            ifmt === 'jpg' ? 'jpeg' : ifmt
          };base64,${imageToEmbed.data.toString('base64')}`;
          break;
      }

      if (datauri) {
        isEmbed = true;
        img.attr('src', datauri);
        img.removeAttr('loading');
        img.removeAttr('decoding');

        state.reportSummary({
          action: `${imageToEmbed.format}->embed`,
          originalSize: await originalImage.getLen(),
          compressedSize: imageToEmbed.data.length,
        });
      }
    }
  }

  if (isEmbed && (await originalImage.getExt()) === 'svg') {
    // SVG has a different behaviour with image size
    // Needs to be tested more
    // For the moment skip image size for SVG
    return;
  }

  /*
   * Attribute 'width' & 'height'
   */
  const [w, h] = await setImageSize(state, htmlfile, img, originalImage);

  if (isEmbed) {
    // Image is embed, no need for more processing
    return;
  }

  //
  // Stop here if svg
  //
  if ((await originalImage.getExt()) === 'svg') {
    return;
  }

  // Image size to beat in srcsets
  //
  const imageLengthToBeatInSrcSet =
    newImage?.data && newImage.data.length < (await originalImage.getLen())
      ? newImage.data.length
      : await originalImage.getLen();

  /*
   * Attribute 'srcset'
   */
  if (img.attr('srcset')) {
    // If srcset are set, don't touch it.
    // The compress pass will compress the images
    // of the srcset
  } else if (!fullSize) {
    const new_srcset = await generateSrcSet(
      state,
      htmlfile,
      originalImage,
      img.attr('src'),
      imageLengthToBeatInSrcSet,
      { toFormat: srcToFormat }
    );

    if (new_srcset !== null) {
      img.attr('srcset', new_srcset);
    }

    // Add sizes attribute if not specified
    if (img.attr('srcset') && !img.attr('sizes')) {
      img.attr('sizes', '100vw');
    }
  }

  /*
   * Adding <source>'s to <picture>
   */
  if (isInPicture) {
    const picture = img.parent();

    // List of possible sources to generate
    //
    const sourcesToGenerate: {
      mime: ImageMimeType;
      format: 'avif' | 'webp';
    }[] = [];

    // Only try to generate better images
    // TODO generate more compatible formats (avif => webp/jpeg/png)
    //
    const mime = await originalImage.getMime();
    switch (mime) {
      case 'image/png':
      case 'image/jpeg':
        sourcesToGenerate.push({
          mime: 'image/webp',
          format: 'webp',
        });
      case 'image/webp':
        // Only add AVIF source for lossy images
        // AVIF don't perform well on lossless images
        // PNG and WebP will perform better
        // https://www.reddit.com/r/jpegxl/comments/l9ta2u/how_does_lossless_jpegxl_compared_to_png/
        // https://twitter.com/jonsneyers/status/1346389917816008704?s=19
        const isLossless =
          mime === 'image/png' ||
          (mime === 'image/webp' &&
            (await originalImage.getImageMeta())?.isLossless);
        if (!isLossless) {
          sourcesToGenerate.push({
            mime: 'image/avif',
            format: 'avif',
          });
        }
      case 'image/avif':
        // Nothing better
        break;
    }

    const sizes = img.attr('sizes');

    for (const s of sourcesToGenerate.reverse()) {
      const sourceWithThisMimeType = picture.children(
        `source[type="${s.mime}"]`
      );
      if (sourceWithThisMimeType.length > 0) {
        // Ignore the creation of sources that already exist
        continue;
      }

      const srcset = await generateSrcSet(
        state,
        htmlfile,
        originalImage,
        undefined,
        undefined,
        {
          toFormat: s.format,
        }
      );

      if (!srcset) {
        // No sourceset generated
        // Image is too small or can't be compressed better
        continue;
      }

      const source = `<source ${
        sizes ? `sizes="${sizes}"` : ''
      } srcset="${srcset}" type="${s.mime}">`;
      img.before(source); // Append before this way existing sources are always top priority
    }
  }
}

async function processMetaImage(
  state: GlobalState,
  htmlfile: string,
  meta: cheerio.Cheerio<cheerio.Element>
): Promise<void> {
  const attribute = 'content';
  let content = meta.attr(attribute);
  if (!content)
    return state.reportIssue(htmlfile, {
      type: 'warn',
      msg: `Missing [content] on meta - processing skipped.`,
    });

  // Setup to ignore
  const { src_exclude, src_include, cdn, external } = state.options.image;
  if (!isIncluded(content, src_include, src_exclude)) return;

  /*
   * Check for external images
   */
  if (isExternalImage(content, external)) {
    if (external.process === 'off')
      // Don't process external images
      return;
    try {
      const external_content = await externalImage(content, state, htmlfile);
      if (external_content) meta.attr(attribute, (content = external_content));
    } catch (e: any) {
      return state.reportIssue(htmlfile, {
        type: 'warn',
        msg: `Failed to process external image: ${attribute} - ${e.message}`,
      }); // No more processing
    }
  }

  const propName = meta.attr('property') ? 'property' : 'name';
  const width = meta.closest(`meta[${propName}:width]`).attr(attribute);

  switch (cdn.process) {
    case 'off':
      break;
    case 'optimize':
      let cdnTransformer = cdn.transformer;
      if (cdnTransformer && !cdn.src_include) {
        throw new Error(
          'config.image.cdn.src_include is required when specifying a config.image.cdn.transformer'
        );
      }
      if (!cdnTransformer) {
        const canonical = getCanonicalCdnForUrl(content);
        if (!canonical) break;
        cdnTransformer = getTransformer(canonical.cdn);
      }
      if (!cdnTransformer) break;
      if (!isIncluded(content, cdn.src_include || /.*/, cdn.src_exclude)) break;
      if (!width)
        return state.reportIssue(htmlfile, {
          type: 'warn',
          msg: `Missing or malformed'width' attribute for image ${content}, unable to perform CDN transform`,
        });
      meta.attr(
        attribute,
        cdnTransformer({ url: content, width: +width })
          ?.toString()
          // unpic adds a default host to absolute paths, remove it
          ?.replace(UNPIC_DEFAULT_HOST_REGEX, '/')
      );
      return;
  }

  /*
   * Loading image
   */
  const originalImage = await Resource.loadResource(state, htmlfile, content);
  if (!originalImage)
    return state.reportIssue(htmlfile, {
      type: 'erro',
      msg: `Can't find img on disk ${attribute}="${content}"`,
    });

  /*
   * Compress image
   */
  const newImage = await compressImage(state, await originalImage.getData(), {
    resize: width ? { width: +width } : undefined,
    toFormat:
      meta.closest(`meta[${propName}:type]`).attr(attribute) === 'image/png'
        ? 'png'
        : 'jpeg',
  });

  if (newImage?.data && newImage.data.length < (await originalImage.getLen())) {
    meta.attr(
      attribute,
      path.join(
        path.dirname(content),
        path.basename(content, path.extname(content)) + `.${newImage.format}`
      )
    );

    const newFilename = path.join(
      path.dirname(originalImage.filePathAbsolute),
      path.basename(
        originalImage.filePathAbsolute,
        path.extname(originalImage.filePathAbsolute)
      ) + `.${newImage.format}`
    );

    if (!state.compressedFiles.has(newFilename)) {
      if (!state.args.nowrite)
        await (state.vfs ?? fsp).writeFile(newFilename, newImage.data);
      // Mark new file as compressed
      state.compressedFiles.add(newFilename);
      // Report compression result
      state.reportSummary({
        action:
          newFilename !== originalImage.filePathAbsolute
            ? `${await originalImage.getExt()}->${newImage.format}`
            : path.extname(originalImage.filePathAbsolute),
        originalSize: await originalImage.getLen(),
        compressedSize: newImage.data.length,
      });
    }
  }
}

const isIncluded = (
  src: string,
  includeConf: RegExp,
  excludeConf: RegExp | null
) => !!src.match(includeConf) && (!excludeConf || !src.match(excludeConf));

async function _generateSrcSet(
  { options }: GlobalState,
  startSrc: string | undefined,
  imageWidth: number | undefined,
  imageHeight: number | undefined,
  transformSrc: (
    valueW: number
  ) => string | Promise<string | undefined> | undefined
): Promise<string | null> {
  // Start from original image
  let new_srcset = '';

  if (!imageWidth || !imageHeight) {
    // Forget about srcset
    return null;
  }

  // Start reduction
  const step = options.image.srcset_step; //px
  let valueW = !startSrc ? imageWidth : imageWidth - step;
  valueW = Math.min(valueW, options.image.srcset_max_width);

  while (valueW >= options.image.srcset_min_width) {
    let src = await transformSrc(valueW);
    if (src) {
      new_srcset += `, ${src} ${valueW}w`;
    }
    // reduce size
    valueW -= step;
  }

  if (new_srcset) {
    return startSrc
      ? `${startSrc} ${imageWidth}w` + new_srcset
      : new_srcset.slice(2);
  }

  return null;
}

async function generateSrcSet(
  state: GlobalState,
  htmlfile: string,
  originalImage: Resource,
  startSrc: string | undefined,
  startSrcLength: number | undefined,
  options: ImageOutputOptions
): Promise<string | null> {
  const ext = path.extname(originalImage.src);
  const fullbasename = originalImage.src.slice(0, -ext.length);
  const imageSrc = (addition: string) =>
    `${fullbasename}${addition}${
      options.toFormat === 'unchanged'
        ? ext
        : `.${options.toFormat?.split('+')[0]}`
    }`;

  const meta = await originalImage.getImageMeta();
  const imageWidth = meta?.width || 0;
  const imageHeight = meta?.height || 0;

  let previousImageSize = startSrcLength || Number.MAX_VALUE;

  return _generateSrcSet(
    state,
    startSrc,
    imageWidth,
    imageHeight,
    async (valueW) => {
      const src = imageSrc(`@${valueW}w`);

      const absoluteFilename = translateSrc(
        state.dir,
        path.dirname(htmlfile),
        src
      );

      // Don't generate srcset file twice
      if (!state.compressedFiles.has(absoluteFilename)) {
        const compressedImage = await compressImage(
          state,
          await originalImage.getData(),
          { ...options, resize: { width: valueW } }
        );

        if (
          !compressedImage?.data ||
          compressedImage.data.length >= previousImageSize
        ) {
          // New image is not compressed or bigger than previous image in srcset
          // Don't add to srcset
          return;
        } else {
          // Write file
          if (!state.args.nowrite) {
            await (state.vfs ?? fsp).writeFile(
              absoluteFilename,
              compressedImage.data
            );
          }

          // Set new previous size to beat
          previousImageSize = compressedImage.data.length;

          // Add file to list avoid recompression
          state.compressedFiles.add(absoluteFilename);
        }
      }
      return src;
    }
  );
}

async function generateSrcSetForCdn(
  state: GlobalState,
  startSrc: string,
  cdnTransformer: UrlTransformer,
  imageWidth: number | undefined,
  imageHeight: number | undefined
): Promise<string | null> {
  return _generateSrcSet(state, '', imageWidth, imageHeight, (valueW: number) =>
    cdnTransformer({
      url: startSrc,
      width: valueW,
    })
      ?.toString()
      // unpic adds a default host to absolute paths, remove it
      ?.replace(UNPIC_DEFAULT_HOST_REGEX, '/')
  );
}

async function setImageSize(
  state: GlobalState,
  htmlfile: string,
  img: cheerio.Cheerio<cheerio.Element>,
  image: Resource
): Promise<number[]> {
  let width = img.attr('width');
  let height = img.attr('height');
  let width_new: number | undefined = undefined;
  let height_new: number | undefined = undefined;
  const img_fmt = await image.getExt();

  if (img_fmt === 'svg' && !state.options.image.svg.add_width_and_height) {
    return [];
  }

  // Check valid values
  if (width !== undefined) {
    if (!isNumeric(width)) {
      state.reportIssue(htmlfile, {
        type: 'fix',
        msg: `Invalid width attribute format: "${width}" - overriding for ${image.src}`,
      });
      width = undefined;
    }
  }
  if (height !== undefined) {
    if (!isNumeric(height)) {
      state.reportIssue(htmlfile, {
        type: 'fix',
        msg: `Invalid height attribute format: "${height}" - overriding for ${image.src}`,
      });
      height = undefined;
    }
  }

  // If we don't have the metadata, we can't do much more
  const meta = await image.getImageMeta();
  if (!meta) {
    throw new Error(
      `Can't get image meta information of "${image.src}" - some optimizations are not possible without this information.`
    );
  }

  if (meta.width === undefined && meta.height === undefined) {
    throw new Error(
      `Can't get image width and height of "${image.src}" - some optimizations are not possible without this information.`
    );
  }

  const originalRatio = meta.width! / meta.height!;

  if (width !== undefined && height !== undefined) {
    // Both are provided
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    return [w, h];
  } else if (width !== undefined && height === undefined) {
    // Width is provided
    width_new = parseInt(width, 10);
    height_new = width_new / originalRatio;
  } else if (width === undefined && height !== undefined) {
    // Height is provided
    height_new = parseInt(height, 10);
    width_new = height_new * originalRatio;
  } else {
    // No width or height provided - set both to image size

    if (img_fmt === 'svg') {
      // svg with no height and width has special sizing by browsers
      // They size it inside 300x150 unless they have width and height
      // attributes

      // Load svg
      const c = cheerio.load(await image.getData(), {});
      const svg = c('svg').first();
      const svg_viewbox = svg.attr('viewbox'); // bug in cheerio here, should be "viewBox"
      const svg_width = svg.attr('width');
      const svg_height = svg.attr('height');

      // Calculate aspect ratio from viewbox
      let svg_aspectratio_from_viewbox: number | undefined = undefined;
      if (svg_viewbox) {
        const box = svg_viewbox.split(' ');
        const w = parseInt(box[2], 10);
        const h = parseInt(box[3], 10);
        svg_aspectratio_from_viewbox = w / h;
      }

      // Set size
      //
      if (
        svg_width &&
        isNumeric(svg_width) &&
        svg_height &&
        isNumeric(svg_height)
      ) {
        // height and width are present
        // use them
        width_new = parseInt(svg_width, 10);
        height_new = parseInt(svg_height, 10);
      } else if (
        svg_width === undefined &&
        svg_height === undefined &&
        svg_aspectratio_from_viewbox
      ) {
        // no height and no width but viewbox is present
        // fit it in default browser box 300x150
        if (svg_aspectratio_from_viewbox >= 2) {
          // fit width
          width_new = 300;
          height_new = width_new / svg_aspectratio_from_viewbox;
        } else {
          // fit height
          height_new = 150;
          width_new = height_new * svg_aspectratio_from_viewbox;
        }
      } else {
        // no width and no height and no viewbox
        // default browser values
        width_new = 300;
        height_new = 150;
      }
    } else {
      width_new = meta.width;
      height_new = meta.height;
    }
  }

  // New sizes
  if (width_new !== undefined && height_new !== undefined) {
    const result_w = Math.round(width_new);
    const result_h = Math.round(height_new);
    img.attr('width', result_w.toFixed(0));
    img.attr('height', result_h.toFixed(0));
    return [result_w, result_h];
  }

  // Something when wrong
  throw new Error(`Unexpected issue when resolving image size "${image.src}"`);
}

export async function optimize(
  state: GlobalState,
  include?: string,
  exclude?: string
): Promise<void> {
  const glob = include ? [include] : ['**/*.{htm,html}'];
  if (exclude) glob.push('!' + exclude);

  const paths = await globby(glob, { cwd: state.dir });

  // Sequential async
  for (const file of paths) {
    await analyse(state, file);
    state.onAnalysedFile?.(file);
  }
}

async function processTag(
  state: GlobalState,
  file: string,
  $: cheerio.CheerioAPI,
  tag: 'img' | 'iframe' | 'video' | 'meta',
  attribute_to_log: string,
  processor: (
    state: GlobalState,
    file: string,
    tag: cheerio.Cheerio<cheerio.Element>,
    isAboveTheFold: boolean,
    appendToBody: Record<string, string>
  ) => Promise<void>,
  theFold: number,
  appendToBody: Record<string, string>
) {
  const previous_issues = state.issues.get(file);

  const tags: cheerio.Cheerio<cheerio.Element> = $(tag);
  const tagsArray: cheerio.Element[] = [];
  tags.each((index, tagElement) => {
    tagsArray.push(tagElement);
  });

  // Process tags sequentially
  const spinnerImg = ora({ prefixText: ' ' }).start();
  for (let i = 0; i < tagsArray.length; i++) {
    const tagElement = tagsArray[i];

    spinnerImg.text = kleur.dim(
      `<${tag}> [${i + 1}/${tagsArray.length}] ${$(tagElement).attr(
        attribute_to_log
      )}`
    );

    const el = $(tagElement);
    const isAboveTheFold = isElementAboveTheFold(el, tagElement, theFold);
    el.removeAttr(ABOVE_FOLD_DATA_ATTR);

    try {
      await processor(state, file, el, isAboveTheFold, appendToBody);
    } catch (e) {
      state.reportIssue(file, {
        type: 'erro',
        msg:
          (e as Error).message ||
          `Unexpected error while processing ${tag}: ${JSON.stringify(e)}`,
      });
    }
  }

  // Reset spinner
  spinnerImg.text = kleur.dim(
    `<${tag}> [${tagsArray.length}/${tagsArray.length}]`
  );

  // Notify issues
  const issues = state.issues.get(file);
  const newIssues = (issues?.length || 0) - (previous_issues?.length || 0);
  if (newIssues > 0) {
    spinnerImg.fail();
  } else {
    spinnerImg.succeed();
  }
}

const isExternalImage = (
  content: string,
  external: Options['image']['external']
) =>
  !isLocal(content) &&
  isIncluded(content, external.src_include, external.src_exclude);

async function externalImage(
  content: string,
  state: GlobalState,
  htmlfile: string
): Promise<string | undefined> {
  const { process } = state.options.image.external;
  if (process === 'download')
    // Download external image for local processing
    return await downloadExternalImage(state, htmlfile, content);
  if (typeof process === 'function')
    // Custom processing for external image
    return await process(content);
}

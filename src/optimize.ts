import { globby } from 'globby';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as cheerio from '@divriots/cheerio';
import { isNumeric } from './utils.js';
import config from './config.js';
import {
  Image,
  compressImage,
  ImageMimeType,
  ImageOutputOptions,
} from './compressors/images.js';
import svgToMiniDataURI from 'mini-svg-data-uri';
import $state from './state.js';
import kleur from 'kleur';
import ora from 'ora';
import { isLocal, Resource, translateSrc } from './utils/resource.js';
import { downloadExternalImage } from './optimizers/img-external.js';

async function analyse(file: string): Promise<void> {
  console.log('▶ ' + file);

  const html = (await fs.readFile(path.join($state.dir, file))).toString();
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true });

  const theFold = getTheFold($);

  const imgs = $('img');
  const imgsArray: cheerio.Element[] = [];
  imgs.each((index, imgElement) => {
    imgsArray.push(imgElement);
  });

  // Process images sequentially
  const spinnerImg = ora({ prefixText: ' ' }).start();
  for (let i = 0; i < imgsArray.length; i++) {
    const imgElement = imgsArray[i];

    spinnerImg.text = kleur.dim(
      `<img> [${i + 1}/${imgsArray.length}] ${$(imgElement).attr('src')}`
    );

    const isAboveTheFold = imgElement.startIndex! < theFold;

    try {
      await processImage(file, $, imgElement, isAboveTheFold);
    } catch (e) {
      $state.reportIssue(file, {
        type: 'erro',
        msg:
          (e as Error).message ||
          `Unexpected error while processing image: ${JSON.stringify(e)}`,
      });
    }
  }

  // Reset spinner
  spinnerImg.text = kleur.dim(
    `<img> [${imgsArray.length}/${imgsArray.length}]`
  );

  // Notify issues
  const issues = $state.issues.get(file);
  if (issues) {
    spinnerImg.fail();
    console.log(
      kleur.red(`  ${issues.length} issue${issues.length > 1 ? 's' : ''}`)
    );
  } else {
    spinnerImg.succeed();
  }

  const iframes = $('iframe');
  const iframesArray: cheerio.Element[] = [];
  iframes.each((index, ifElement) => {
    iframesArray.push(ifElement);
  });

  // Process iframes sequentially
  const spinnerIframe = ora({ prefixText: ' ' }).start();
  for (let i = 0; i < iframesArray.length; i++) {
    const ifElement = iframesArray[i];

    spinnerIframe.text = kleur.dim(
      `<iframe> [${i + 1}/${iframesArray.length}] ${$(ifElement).attr('src')}`
    );

    const isAboveTheFold = ifElement.startIndex! < theFold;

    try {
      await processIframe(file, $, ifElement, isAboveTheFold);
    } catch (e) {
      $state.reportIssue(file, {
        type: 'erro',
        msg:
          (e as Error).message ||
          `Unexpected error while processing image: ${JSON.stringify(e)}`,
      });
    }
  }

  // Reset spinner
  spinnerIframe.text = kleur.dim(
    `<iframe> [${imgsArray.length}/${imgsArray.length}]`
  );

  spinnerIframe.succeed();

  // Remove the fold
  if (theFold) {
    $('the-fold').remove();
  }

  // Add CSS to head
  if (config.html.add_css_reset_as === 'inline') {
    const CSS = `<style>:where(img){height:auto;}</style>`;
    const heads = $('head');
    if (heads.length > 0) {
      heads.prepend(CSS);
    } else {
      $('html')?.prepend(`<head>${CSS}</head>`);
    }
  }

  if (!$state.args.nowrite) {
    await fs.writeFile(path.join($state.dir, file), $.html());
  }
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
  htmlfile: string,
  $: cheerio.CheerioAPI,
  imgElement: cheerio.Element,
  isAboveTheFold: boolean
): Promise<void> {
  const img = $(imgElement);

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

    $state.reportIssue(htmlfile, {
      type: 'warn',
      msg: `Missing [src] on img - processing skipped.`,
    });
    return;
  }

  /*
   * Attribute 'alt'
   */
  const attrib_alt = img.attr('alt');
  if (attrib_alt === undefined) {
    $state.reportIssue(htmlfile, {
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
        $state.reportIssue(htmlfile, {
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
  if (!isLocal(attrib_src)) {
    switch (config.image.external.process) {
      case 'off': // Don't process external images
        return;
      case 'download': // Download external image for local processing
        try {
          attrib_src = await downloadExternalImage(htmlfile, attrib_src);
          img.attr('src', attrib_src);
        } catch (e: any) {
          $state.reportIssue(htmlfile, {
            type: 'warn',
            msg: `Failed to download image: ${attrib_src} - ${e.message}`,
          });
          return; // No more processing
        }
        break;
    }
  }

  /*
   * Loading image
   */
  const originalImage = await Resource.loadResource(
    $state.dir,
    htmlfile,
    attrib_src
  );

  // No file -> give up
  if (!originalImage) {
    $state.reportIssue(htmlfile, {
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

  let srcToFormat: 'webp' | 'avif' | 'jpeg' | 'jpeg+progressive' | 'unchanged' =
    'unchanged';
  if (isAboveTheFold) {
    // Above the fold, nothing beats progressive JPEG for LCP
    // but it's not transparent
    if ((await originalImage.getImageMeta())?.hasAlpha) {
      // TODO some images have Alpha metadata but have 0 alpha pixels
      // We should be able to detect these to take advantage of Progressive JPEG
      srcToFormat =
        (await originalImage.getMime()) === 'image/avif' ||
        (await originalImage.getMime()) === 'image/webp'
          ? 'unchanged'
          : 'webp';
    } else {
      srcToFormat = 'jpeg+progressive';
    }
  } else if (isInPicture) {
    // srcToFormat should not change if in picture
  } else {
    // Let's go to avif -> avif , webp -> webp, else * -> webp
    srcToFormat =
      (await originalImage.getMime()) === 'image/avif' ||
      (await originalImage.getMime()) === 'image/webp'
        ? 'unchanged'
        : 'webp';
  }

  newImage = await compressImage(await originalImage.getData(), {
    toFormat: srcToFormat,
  });

  if (
    newImage?.data &&
    (newImage.data.length < (await originalImage.getLen()) ||
      srcToFormat === 'jpeg+progressive') // Progressive override all even if worse
  ) {
    const additionalExtension = `.${newImage.format}`;
    const newFilename = originalImage.filePathAbsolute + additionalExtension;

    if (!$state.compressedFiles.has(newFilename) && !$state.args.nowrite) {
      fs.writeFile(newFilename, newImage.data);
    }

    // Mark new file as compressed
    $state.compressedFiles.add(newFilename);

    // Report compression result
    $state.reportSummary({
      action:
        newFilename !== originalImage.filePathAbsolute
          ? `${await originalImage.getExt()}->${newImage.format}`
          : path.extname(originalImage.filePathAbsolute),
      originalSize: await originalImage.getLen(),
      compressedSize: newImage.data.length,
    });

    img.attr('src', attrib_src + additionalExtension);
  } else {
    // Drop new Image
    newImage = undefined;

    // Report non-compression
    $state.reportSummary({
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
      let datauri = undefined;

      const ifmt = imageToEmbed.format;
      switch (ifmt) {
        case 'svg':
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

        $state.reportSummary({
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
  const [w, h] = await setImageSize(htmlfile, img, originalImage);

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
  } else {
    const new_srcset = await generateSrcSet(
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

    if (isAboveTheFold && srcToFormat === 'jpeg+progressive') {
      // We don't need anything else than jpeg progressive above the fold
      const nodes = picture.children(`source`);
      nodes.remove();
    } else {
      // List of possible sources to generate
      //
      const sourcesToGenerate: {
        mime: ImageMimeType;
        format: 'avif' | 'webp';
      }[] = [];

      // Only try to generate better images
      // TODO generate more compatible formats (avif => webp/jpeg/png)
      //
      switch (await originalImage.getMime()) {
        case 'image/jpeg':
        case 'image/png':
          sourcesToGenerate.push({
            mime: 'image/webp',
            format: 'webp',
          });
        case 'image/webp':
          sourcesToGenerate.push({
            mime: 'image/avif',
            format: 'avif',
          });
        case 'image/avif':
          // Nothing better
          break;
      }

      const sizes = img.attr('sizes');

      for (const s of sourcesToGenerate) {
        const sourceWithThisMimeType = picture.children(
          `source[type="${s.mime}"]`
        );
        if (sourceWithThisMimeType.length > 0) {
          // Ignore the creation of sources that already exist
          continue;
        }

        const srcset = await generateSrcSet(
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
        picture.prepend(source);
      }

      // Reorder sources to priority order 1)avif 2)webp
      //
      function popupSource(type: ImageMimeType): void {
        const nodes = picture.children(`source[type="${type}"]`);
        picture.prepend(nodes);
      }
      popupSource('image/webp');
      popupSource('image/avif');
    }
  }
}

async function generateSrcSet(
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

  // Start from original image
  let new_srcset = '';

  const meta = await originalImage.getImageMeta();
  const imageWidth = meta?.width || 0;
  const imageHeight = meta?.height || 0;
  if (!imageWidth || !imageHeight) {
    // Forget about srcset
    return null;
  }

  // Start reduction
  const step = 300; //px
  const ratio = imageWidth / imageHeight;
  let valueW = !startSrc ? imageWidth : imageWidth - step;
  let valueH = Math.trunc(valueW / ratio);
  let previousImageSize = startSrcLength || Number.MAX_VALUE;

  while (valueW >= config.image.srcset_min_width) {
    const src = imageSrc(`@${valueW}w`);

    const absoluteFilename = translateSrc(
      $state.dir,
      path.dirname(htmlfile),
      src
    );

    let doAddToSrcSet = true;

    // Don't generate srcset file twice
    if (!$state.compressedFiles.has(absoluteFilename)) {
      const compressedImage = await compressImage(
        await originalImage.getData(),
        { ...options, resize: { width: valueW, height: valueH } }
      );

      if (
        !compressedImage?.data ||
        compressedImage.data.length >= previousImageSize
      ) {
        // New image is not compressed or bigger than previous image in srcset
        // Don't add to srcset
        doAddToSrcSet = false;
      } else {
        // Write file
        if (!$state.args.nowrite) {
          fs.writeFile(absoluteFilename, compressedImage.data);
        }

        // Set new previous size to beat
        previousImageSize = compressedImage.data.length;

        // Add file to list avoid recompression
        $state.compressedFiles.add(absoluteFilename);
      }
    }

    if (doAddToSrcSet) {
      new_srcset += `, ${src} ${valueW}w`;
    }

    // reduce size
    valueW -= step;
    valueH = Math.trunc(valueW / ratio);
  }

  if (new_srcset) {
    return startSrc
      ? `${startSrc} ${imageWidth}w` + new_srcset
      : new_srcset.slice(2);
  }

  return null;
}

async function setImageSize(
  htmlfile: string,
  img: cheerio.Cheerio<cheerio.Element>,
  image: Resource
): Promise<number[]> {
  let width = img.attr('width');
  let height = img.attr('height');
  let width_new: number | undefined = undefined;
  let height_new: number | undefined = undefined;

  // Check valid values
  if (width !== undefined) {
    if (!isNumeric(width)) {
      $state.reportIssue(htmlfile, {
        type: 'fix',
        msg: `Invalid width attribute format: "${width}" - overriding for ${image.src}`,
      });
      width = undefined;
    }
  }
  if (height !== undefined) {
    if (!isNumeric(height)) {
      $state.reportIssue(htmlfile, {
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

    if ((await image.getExt()) === 'svg') {
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

async function processIframe(
  htmlfile: string,
  $: cheerio.CheerioAPI,
  imgElement: cheerio.Element,
  isAboveTheFold: boolean
): Promise<void> {
  const iframe = $(imgElement);

  if (!isAboveTheFold) {
    iframe.attr('loading', 'lazy');
  }
}

export async function optimize(
  include?: string,
  exclude?: string
): Promise<void> {
  const glob = include ? [include] : ['**/*.{htm,html}'];
  if (exclude) glob.push('!' + exclude);

  const paths = await globby(glob, { cwd: $state.dir });

  // Sequential async
  for (const file of paths) {
    await analyse(file);
  }
}

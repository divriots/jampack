import { globby } from 'globby';
import * as path from 'path';
import * as fs from 'fs/promises';
import cheerio from 'cheerio';
import { isLocal, isNumeric, translateSrc } from './utils.js';
import sharp from "sharp";
import config from './config.js';
import { compressImage } from './compress.js';
import svgToMiniDataURI from 'mini-svg-data-uri';
import $state from './state.js';
import type { Image } from './types.js';
import kleur from 'kleur';
import ora from 'ora';

async function analyse(file: string): Promise<void> {
  console.log('▶ ' + file);

  const html = (await fs.readFile(path.join($state.dir, file))).toString();
  const $ = cheerio.load(html, {});

  const imgs = $('img');
  const imgsArray: cheerio.Element[] = [];
  imgs.each(async (index, imgElement) => {
    imgsArray.push(imgElement);
  });

  // Process images sequentially
  const spinnerImg = ora({ prefixText:' '}).start();
  for(let i=0; i<imgsArray.length; i++) {
    const imgElement = imgsArray[i];
    spinnerImg.text = kleur.dim(`<img> [${i+1}/${imgsArray.length}] ${$(imgElement).attr('src')} `);
    await processImage(file, $, imgElement);
  }

  const issues = $state.issues.get(file);
  if (issues) {
    spinnerImg.text = kleur.dim(`<img> [${imgsArray.length}/${imgsArray.length}] - ${issues.length} issue(s) found.`);
    spinnerImg.fail();
  }
  else {
    spinnerImg.text = kleur.dim(`<img> [${imgsArray.length}/${imgsArray.length}]`);
    spinnerImg.succeed();
  }

  if (!$state.args.nowrite) {
    await fs.writeFile(path.join($state.dir, file), $.html());
  }

}

async function processImage(htmlfile: string, $: cheerio.Root, imgElement: cheerio.Element): Promise<void> {
  try {

    const img = $(imgElement);

    /*
    * Attribute 'alt'
    */
    const attrib_alt = img.attr('alt');
    if (attrib_alt === undefined) {
      $state.reportIssue(htmlfile, { type: "warn", message: "Missing alt on img"});
      img.attr('alt', "");
    }

    /*
    * Attribute 'src'
    */
    const attrib_src = img.attr('src');
    if (!attrib_src) {
      console.warn('<img> has no src attribute');
      return;
    }

    if (attrib_src.startsWith('data:')) {
      // Data URI image
      // TODO: try to compress it
      return;
    }

    if (!isLocal(attrib_src)) {
      // Image not local, don't touch it
      return;
    }

    /*
    * Attribute 'loading'
    */
    const attr_loading = img.attr('loading');
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
        console.warn(`Invalid loading attribute ${attr_loading}`)
    }

    /*
    * Attribute 'decoding'
    */
    img.attr('decoding', 'async');

    /*
    * Loading image
    */
    const absoluteImgPath = translateSrc($state.dir, path.dirname(htmlfile), attrib_src);

    // file exists?
    try {
      await fs.stat(absoluteImgPath);
    }
    catch (e) {
      //console.error(`Missing img ${absoluteImgPath}`);
      return;
    }

    const sharpFile = sharp(absoluteImgPath);
    const meta = await sharpFile.metadata();
    const originalData = await fs.readFile(absoluteImgPath);

    /*
     * Compress image to WebP
     */
    let newImage: Image | undefined;

    if (!$state.optimizedFiles.has(absoluteImgPath)) {

      // Let's avoid to optimize same images twice
      $state.optimizedFiles.add(absoluteImgPath);

      newImage = await compressImage(originalData, {}, true);
      if (newImage?.data && newImage.data.length < originalData.length) {
        // Do we need to add an new extension?
        const newExtension = `.${newImage.format}`;
        const additionalExtension = path.extname(absoluteImgPath) === newExtension ? '' : newExtension;

        const newFilename = absoluteImgPath+additionalExtension;
        
        if (!$state.args.nowrite) {
          fs.writeFile(newFilename, newImage.data);
        }

        $state.compressedFiles.add(newFilename);

        // Report compression result
        $state.reportSummary({
          action: (newFilename !== absoluteImgPath) ? `${meta.format}->${newImage.format}` : path.extname(absoluteImgPath),
          originalSize: originalData.length,
          compressedSize: newImage.data.length
        });
        
        img.attr('src', attrib_src+additionalExtension);
      }

    }

    /*
     * Embed small images
     *
     * TODO this is only embedding images that have
     * successfully be compressed. Should embed original
     * image if it fits the size.
     */
    let isEmbed = false;
    if (newImage && newImage.data.length <= config.image.embed_size) {
      let datauri = undefined;

      switch (newImage.format) {
        case 'svg':
          datauri = svgToMiniDataURI(newImage.data.toString());
          break;
        case 'webp':
          datauri = `data:image/webp;base64,${newImage.data.toString('base64')}`;
          break;
        case 'jpg':
        case 'png':
          // TODO but not possible in current code
          break;
      }

      if (datauri) {
        isEmbed = true;
        img.attr('src', datauri);
        img.removeAttr('loading');
        img.removeAttr('decoding');

        $state.reportSummary({ action: `${newImage.format}->embed`, originalSize: originalData.length, compressedSize: newImage.data.length});
      }
    }

    if (isEmbed) {
      // Image is embed, no need for more processing
      return;
    }

    //
    // Stop here if svg
    //
    if (meta.format === 'svg') return;

    /*
     * Attribute 'width' & 'height'
     */
    const [w, h] = setImageSize(img, meta);
    if (w < 0 || h < 0) {
      console.warn(`Unexpected error in image size calculation - some optimizations can't be done`);
      return;
    }

    /*
     * Attribute 'srcset'
     */
    const attr_srcset = img.attr('srcset');
    if (attr_srcset) {
      // If srcset is set, don't touch it.
      // The compress pass will compress the images
      // of the srcset
    }
    else {
      // Generate image set
      const ext = path.extname(attrib_src);
      const fullbasename = attrib_src.slice(0, -(ext.length));
      const imageSrc = (addition: string) => `${fullbasename}${addition}.webp`;

      // Start from original image
      let new_srcset = '';

      // Start reduction
      const step = 300; //px
      const ratio = w / h;
      let valueW = w - step;
      let valueH = Math.trunc(valueW / ratio);

      while (valueW > config.image.srcset_min_width) {
        const src = imageSrc(`@${valueW}w`);

        //console.log(`Generating srcset ${src}`);

        const absoluteFilename = translateSrc($state.dir, path.dirname(htmlfile), src);
        
        // Don't generate srcset file twice
        if (!$state.compressedFiles.has(absoluteFilename)) {
          // Add file to list avoid recompression
          $state.compressedFiles.add(absoluteFilename);

          const compressedImage = await compressImage(originalData, { width: valueW, height: valueH }, true);

          if (compressedImage?.data && !$state.args.nowrite) {
            fs.writeFile(absoluteFilename, compressedImage.data);
          }  
        }

        new_srcset += `, ${src} ${valueW}w`;

        // reduce size
        valueW -= step;
        valueH = Math.trunc(valueW / ratio);
      }

      if (new_srcset) {
        img.attr('srcset', `${img.attr('src')} ${w}w` + new_srcset);
      }
    }

  }
  catch (e) {
    console.error('Error while processing image');
    console.error(e);
    // exit here
    // exit(1);
  }
}

function setImageSize(img: cheerio.Cheerio, meta: sharp.Metadata): number[] {
  let width = img.attr('width');
  let height = img.attr('height');
  let width_new: number | undefined = undefined;
  let height_new: number | undefined = undefined;

  // Check valid values
  if (width !== undefined) {
    if (!isNumeric(width)) {
      //console.warn(`Invalid width attribute "${width}" - overriding`);
      width = undefined;
    }
  }
  if (height !== undefined) {
    if (!isNumeric(height)) {
      //console.warn(`Invalid height attribute "${height}" - overriding`);
      height = undefined;
    }
  }

  // If we don't have the metadata, we can't do much more
  if (meta.width === undefined || meta.height === undefined) {
    return [-1, -1];
  }

  const originalRatio = meta.width / meta.height;

  if (width !== undefined && height !== undefined) {
    // Both are provided
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    // Is ratio equal?
    const providedRatio = Math.round(w / h * 10) / 10;
    const imageRatio = Math.round(originalRatio * 10) / 10;
    if (providedRatio !== imageRatio) {
      //console.warn(`Image aspect ratio in HTML (${providedRatio}) differs from image aspect ratio (${imageRatio}) - fix width and height or let jampack fill them.`);
    }

    return [w, h];
  } else if (width !== undefined && height === undefined) {
    // Width is provided
    width_new = parseInt(width, 10);
    height_new = width_new / originalRatio;
  }
  else if (width === undefined && height !== undefined) {
    // Height is provided
    height_new = parseInt(height, 10);
    width_new = height_new * originalRatio;
  }
  else {
    // No width or height provided - set both to image size
    width_new = meta.width;
    height_new = meta.height;
  }

  // New sizes
  if (width_new !== undefined && height_new !== undefined) {
    img.attr('width', width_new.toFixed(0));
    img.attr('height', height_new.toFixed(0));
    return [Math.round(width_new), Math.round(height_new)];
  }

  // Something when wrong
  throw new Error('Unexpected issue when resolving image sizes')
}

export async function optimize(exclude?: string): Promise<void> {

  const glob = ['**/*.{htm,html}'];
  if (exclude) glob.push('!'+exclude);

  const paths = await globby(glob, { cwd: $state.dir });

  // Sequential async
  for(const file of paths) {
    await analyse(file);
  };
}

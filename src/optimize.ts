import { globby } from 'globby';
import * as path from 'path';
import * as fs from 'fs/promises';
import cheerio from 'cheerio';
import { isLocal, isNumeric, translateSrc } from './utils.js';
import sharp from "sharp";
import options from './options.js';
import { compressImage } from './compress.js';
import type { Result } from './types.js';

const compressedImages: string[] = [];
const compressedResults: Result[] = [];

async function analyse(dir: string, file: string): Promise<void> {
  console.log('Processing ' + file);

  const html = (await fs.readFile(path.join(dir, file))).toString();
  const $ = cheerio.load(html, {});

  const imgs = $('img');
  const imgsArray: cheerio.Element[] = [];
  imgs.each(async (index, imgElement) => {
    imgsArray.push(imgElement);
  });

  // Process images sequentially
  await imgsArray.reduce(async (previousPromise, imgElement) => {
      await previousPromise;
      return processImage(dir, file, $, imgElement);
    }, Promise.resolve());

  await fs.writeFile(path.join(dir, file), $.html());
}

async function processImage(dir: string, file: string, $: cheerio.Root, imgElement: cheerio.Element) {
  const img = $(imgElement);

  /*
   * Attribute 'alt'
   */ 
  const attrib_alt = img.attr('alt');
  if (attrib_alt === undefined) {
    console.warn('<img> has no alt attribute - adding an empty but you should fix it');
    img.attr('alt', "");
  }

  /*
   * Attribute 'src'
   */
  const attrib_src = img.attr('src');
  console.log(`- Image ${attrib_src}`);
  if (!attrib_src)
  {
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
  switch(attr_loading) {
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
  const absoluteImgPath = translateSrc(dir, path.dirname(file), attrib_src);

  // file exists?
  try {
    const stats = await fs.stat(absoluteImgPath);
  }
  catch(e) {
    console.error(`Missing img ${absoluteImgPath}`);
    return;
  }
  
  const sharpFile = sharp(absoluteImgPath);
  const meta = await sharpFile.metadata();
  const originalData = await fs.readFile(absoluteImgPath);

  /*
   * Embed small images
   *
   * Note: This check is done pre-compression so more opportunities could
   * be done if done post compression.
   */
  let isEmbed = false;
  if (originalData.length <= options.image.embed_size) {
    let datauri = undefined;

    switch(meta.format) {
      case 'svg':
        const compressedData = await compressImage(originalData, {});
        const svgEmbed = (compressedData && compressedData.length < originalData.length) ? compressedData : originalData;
        datauri = `data:image/svg+xml;utf8,${svgEmbed}`;
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'gif':
        // TODO
        break;
    }

    if (datauri) {
      img.attr('src', datauri);
      isEmbed = true;
      img.removeAttr('loading');
      img.removeAttr('decoding');
      img.removeAttr('width');
      img.removeAttr('height');
    }
  }

  if (isEmbed) {
    // Image is embed, no need for more processing
    return;
  }

  /*
   * Attribute 'width' & 'height'
   */
  const [w, h] = setImageSize(img, meta);
  if (w < 0 || h < 0) {
    console.warn(`Unexpected error in image size calculation - some optimizations can't be done`);
    return;
  }

  /*
   * Compress image
   */
  if (compressedImages.includes(absoluteImgPath)) {
    // Image already compressed. Skip.
    return;
  }

  const fileWidth = meta.width;
  const fileHeight = meta.height;

  const newImage = await compressImage(originalData, {width: w, height: h});
  if (newImage && newImage.length < originalData.length) {
    fs.writeFile(absoluteImgPath, newImage);
    compressedImages.push(absoluteImgPath);
    compressedResults.push({ file: absoluteImgPath, originalSize: originalData.length, compressedSize: newImage.length });
  }

  const attr_srcset = img.attr('srcset');
  if (attr_srcset) {
    // If srcset is set, don't touch it
  }
  else {
    // Generate image set
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
      console.warn(`Invalid width attribute "${width}" - overriding`);
      width = undefined;
    }
  } 
  if (height !== undefined) {
    if (!isNumeric(height)) {
      console.warn(`Invalid width attribute "${height}" - overriding`);
      height = undefined;
    }
  } 

  // If we don't have the metadata, we can't do much more
  if (meta.width === undefined || meta.height === undefined) {
    return [-1, -1];
  }

  const originalRatio = meta.width/meta.height;
  
  if (width !== undefined && height !== undefined) {
    // Both are provided
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    // Is ratio equal?
    const providedRatio = Math.round(w/h*10)/10;
    const imageRatio = Math.round(originalRatio*10)/10;
    if (providedRatio !== imageRatio ) {
      console.warn(`Image aspect ratio in HTML (${providedRatio}) differs from image aspect ratio (${imageRatio}) - fix width and height or let jampack fill them.`);
    }

    return [w, h];
  } else if (width !== undefined && height === undefined) {
    // Width is provided
    width_new = parseInt(width, 10);
    height_new = width_new/originalRatio;
  }
  else if (width === undefined && height !== undefined) {
    // Height is provided
    height_new = parseInt(height, 10);
    width_new = height_new*originalRatio;
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

export async function optimize(dir: string): Promise<Result[]> {
  const paths = await globby('**/*.{htm,html}', { cwd: dir });

  // Sequential async
  await paths.reduce(async (previousPromise, item) => {
      await previousPromise;
      return analyse(dir, item);
    }, Promise.resolve());

  return compressedResults;
}

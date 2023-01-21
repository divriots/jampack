import sharp from 'sharp';
import { optimize as svgo } from 'svgo';
import {
  getFromCacheCompressImage,
  addToCacheCompressImage,
  computeCacheHash,
} from '../cache.js';
import config, { WebpOptions } from '../config.js';

export type ImageFormat = 'webp' | 'svg' | 'jpg' | 'png' | 'avif' | undefined;

export type Image = {
  format: ImageFormat;
  data: Buffer;
};

function createWebpOptions(opt: WebpOptions | undefined): sharp.WebpOptions {
  return {
    nearLossless: opt!.mode === 'lossless',
    quality: opt!.quality,
    effort: opt!.effort,
  };
}

export async function compressImage(
  data: Buffer,
  options: {
    resize?: sharp.ResizeOptions;
    toFormat?: 'webp' | 'pjpg' | 'avif' | 'unchanged';
  }
): Promise<Image | undefined> {
  const cacheHash = computeCacheHash(data, options);
  const imageFromCache = await getFromCacheCompressImage(cacheHash);
  if (imageFromCache) {
    return imageFromCache;
  }

  // Load modifiable toFormat
  let toFormat = options.toFormat || 'unchanged';

  if (!config.image.compress) return undefined;

  let sharpFile = await sharp(data, { animated: true });
  const meta = await sharpFile.metadata();

  if (meta.pages && meta.pages > 1) {
    // Skip animated images for the moment.
    return undefined;
  }

  let outputFormat: ImageFormat;

  // Special case for svg
  if (meta.format === 'svg') {
    const newData = svgo(data, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
      ],
    });
    if (newData.error || newData.modernError) {
      console.log(`Error processing svg ${data}`);
      return undefined;
    }
    return { format: 'svg', data: Buffer.from(newData.data, 'utf8') };
  }

  // The bitmap images
  if (toFormat === 'unchanged') {
    switch (meta.format) {
      case 'png':
        sharpFile = sharpFile.png(config.image.png.options || {});
        outputFormat = 'png';
        break;
      case 'jpeg':
      case 'jpg':
        sharpFile = sharpFile.jpeg(config.image.jpeg.options || {});
        outputFormat = 'jpg';
        break;
      case 'webp':
        sharpFile = sharpFile.webp(
          createWebpOptions(config.image.webp.options_lossly) || {}
        );
        outputFormat = 'webp';
        break;
      case 'avif':
        sharpFile = sharpFile.avif();
        outputFormat = 'avif';
        break;
    }
  } else {
    // To format
    switch (toFormat) {
      case 'pjpg':
        sharpFile = sharpFile.jpeg(
          { ...config.image.jpeg.options, progressive: true } || {}
        );
        outputFormat = 'jpg';
        break;
      case 'webp':
        sharpFile = sharpFile.webp(
          createWebpOptions(
            meta.format === 'png'
              ? config.image.webp.options_lossless
              : config.image.webp.options_lossly
          )
        );
        outputFormat = 'webp';
        break;
      case 'avif':
        sharpFile = sharpFile.avif({ effort: 6 });
        outputFormat = 'avif';
        break;
    }
  }

  // Unknow input format or output format
  // Can't do
  if (!outputFormat) return undefined;

  // If resize is requested
  if (options.resize?.width && options.resize?.height) {
    sharpFile = sharpFile.resize({
      ...options.resize,
      fit: 'fill',
      withoutEnlargement: true,
    });
  }

  //
  // Output image processed
  //

  // Add to cache
  const outputImage: Image = {
    format: outputFormat,
    data: await sharpFile.toBuffer(),
  };

  await addToCacheCompressImage(cacheHash, outputImage);

  // Go
  return outputImage;
}

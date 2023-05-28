import sharp from 'sharp';
import { optimize as svgo } from 'svgo';
import { getFromCache, addToCache, computeCacheHash } from '../cache.js';
import { WebpOptions } from '../config-types.js';
import config from '../config.js';
import { MimeType } from 'file-type';

export type ImageMimeType = MimeType | 'image/svg+xml';

export const AllImageFormat = ['webp', 'svg', 'jpg', 'png', 'avif'];
export type ImageFormat = (typeof AllImageFormat)[number] | undefined;

export type Image = {
  format: ImageFormat;
  data: Buffer;
};

export type ImageOutputOptions = {
  resize?: sharp.ResizeOptions;
  toFormat?:
    | 'webp'
    | 'avif'
    | 'png'
    | 'jpeg'
    | 'jpeg+progressive'
    | 'unchanged';
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
  options: ImageOutputOptions
): Promise<Image | undefined> {
  const cacheHash = computeCacheHash(data, options);
  const imageFromCache = await getFromCache('img', cacheHash);
  if (imageFromCache) {
    return { data: imageFromCache.buffer, format: imageFromCache.meta };
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
    try {
      const output = svgo(data.toString(), {
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
      return { format: 'svg', data: Buffer.from(output.data, 'utf8') };
    } catch (e) {
      // In case of any issue with svg compression:
      return undefined;
    }
  }

  // TODO
  // Use information of input image to the destination format
  // - Progressive (unless overriden)
  // - Lossless

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
      case 'heif':
      case 'avif':
        sharpFile = sharpFile.avif({ effort: 4, quality: 50 }); // TODO create config for avif
        outputFormat = 'avif';
        break;
    }
  } else {
    // To format
    switch (toFormat) {
      case 'jpeg':
        sharpFile = sharpFile.jpeg({ ...config.image.jpeg.options } || {});
        outputFormat = 'jpg';
        break;
      case 'jpeg+progressive':
        sharpFile = sharpFile.jpeg(
          { ...config.image.jpeg.options, progressive: true } || {}
        );
        outputFormat = 'jpg';
        break;
      case 'png':
        sharpFile = sharpFile.png({ ...config.image.png.options } || {});
        outputFormat = 'png';
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
        sharpFile = sharpFile.avif({
          effort: 4,
          quality: meta.format === 'png' ? 80 : 60, // don't use lossless avif it doesn't compress well in most png uses cases
        });
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

  await addToCache('img', cacheHash, {
    buffer: outputImage.data,
    meta: outputImage.format,
  });

  // Go
  return outputImage;
}

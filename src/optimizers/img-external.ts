import * as path from 'path';
import * as fs from 'fs/promises';
import $state from '../state.js';
import hasha from 'hasha';
import { fileTypeFromBuffer } from 'file-type';
import { addToCache, getFromCache } from '../cache.js';
import { parse } from '../utils/cache-control-parser.js';
import '../utils/polyfill-fetch.js';

export async function downloadExternalImage(
  htmlfile: string,
  href: string
): Promise<string> {
  const hash = hasha(href, {
    algorithm: 'md5',
  });

  // Default with values from cache
  let buffer: Buffer | undefined;
  let ext: string | undefined;

  // Image is in cache?
  const dataFromCache = await getFromCache('img-ext', hash);
  const cacheControl = dataFromCache?.meta?.CacheControl;

  if (dataFromCache && cacheControl) {
    const date = dataFromCache?.meta?.Date;
    const maxAge = cacheControl['max-age'];
    const expires = dataFromCache?.meta?.Expires;
    let expireTime = NaN;
    if (date && maxAge) {
      expireTime = Date.parse(date) + maxAge * 1000;
    } else if (expires) {
      expireTime = Date.parse(expires);
    } else {
      // No max-age with Date and no expires
      // No information for cache validity
      // We have to make a request
    }
    // Is cache still valid?
    if (expireTime && Date.now() < expireTime) {
      buffer = dataFromCache.buffer;
      ext = dataFromCache.meta.Extension;
    }
  }

  // No buffer, then no cache hit so let's HTTP request
  if (!buffer) {
    const lastdate = dataFromCache?.meta?.Date;
    const fetchOption: RequestInit = lastdate
      ? { headers: { 'If-Modified-Since': lastdate } }
      : {};

    console.log('Downloading ' + href);
    const resp = await fetch(href, fetchOption);

    switch (resp.status) {
      case 200: // New image
        const responseBuffer = await resp.arrayBuffer();

        // Detect extension
        ext = (await fileTypeFromBuffer(responseBuffer))?.ext;

        buffer = Buffer.from(responseBuffer);

        // Did the server requested no cache?
        const cacheControl = parse(resp.headers.get('Cache-Control') || '');
        const maxAge = cacheControl['max-age'];
        if (
          cacheControl['no-store'] ||
          cacheControl['no-cache'] ||
          cacheControl['must-revalidate'] ||
          (maxAge !== undefined && maxAge < 1)
        ) {
          // No cache requested
        } else {
          // Add downloaded image to cache
          await addToCache('img-ext', hash, {
            buffer,
            meta: {
              Date: resp.headers.get('Date'),
              Extension: ext,
              CacheControl: cacheControl,
            },
          });
        }

        break;
      case 304: // Not modified - image in cache is good to use
        if (dataFromCache) {
          buffer = dataFromCache.buffer;
          ext = dataFromCache.meta.Extension;
        } else {
          // This is not possible
          throw new Error('Assert error: 304 responses but no data in cache');
        }
        break;
      default: // Otherwise something is wrong
        throw new Error(resp.statusText);
    }
  }

  // buffer can't be undefined here
  if (!buffer) throw new Error('Buffer is undefined');

  // Construct contenthash
  const contentHash = hasha(buffer, { algorithm: 'md5' });

  // Construct local filename relative to root dir
  if (!ext) throw new Error('Unknown image format');
  const htmlFolder = path.dirname(htmlfile);
  const filename = path.relative(
    path.join($state.dir, htmlFolder),
    path.join($state.dir, `_jampack/${contentHash}.${ext}`)
  );

  await fs.writeFile(path.join($state.dir, htmlFolder, filename), buffer);

  return filename;
}

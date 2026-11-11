import * as path from 'path';
import * as fsp from 'fs/promises';
import { GlobalState } from '../state.js';
import { hashSync as hasha } from 'hasha';
import { fileTypeFromBuffer } from 'file-type';
import { addToCache, getFromCache } from '../cache.js';
import { parse } from '../utils/cache-control-parser.js';
import '../utils/polyfill-fetch.js';

// Headers needed to know when a cached image expires and to revalidate it
function cacheMetaFromHeaders(headers: Headers) {
  return {
    Date: headers.get('Date'),
    Expires: headers.get('Expires'),
    LastModified: headers.get('Last-Modified'),
    ETag: headers.get('ETag'),
  };
}

export async function downloadExternalImage(
  state: GlobalState,
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
  const dataFromCache = await getFromCache(state, 'img-ext', hash);
  const cacheControl = dataFromCache?.meta?.CacheControl;

  if (dataFromCache && cacheControl) {
    const date = dataFromCache?.meta?.Date;
    const maxAge = cacheControl['max-age'];
    const expires = dataFromCache?.meta?.Expires;
    let expireTime = NaN;
    if (cacheControl['no-cache'] || cacheControl['no-store']) {
      // Must revalidate every time (can be set by a 304 refresh)
    } else if (maxAge !== undefined) {
      // max-age takes precedence over Expires, and 0 means already stale
      if (date) expireTime = Date.parse(date) + maxAge * 1000;
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
    // Revalidate with the validators the server gave us. The response Date
    // must not be used: the image can change after its Last-Modified but
    // before that Date, and the server would then wrongly answer 304.
    const headers: Record<string, string> = {};
    if (dataFromCache?.meta?.ETag) {
      headers['If-None-Match'] = dataFromCache.meta.ETag;
    }
    if (dataFromCache?.meta?.LastModified) {
      headers['If-Modified-Since'] = dataFromCache.meta.LastModified;
    }

    console.log('Downloading ' + href);
    const resp = await fetch(href, { headers });

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
          await addToCache(state, 'img-ext', hash, {
            buffer,
            meta: {
              ...cacheMetaFromHeaders(resp.headers),
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

          // Refresh the cached metadata with the 304 headers so the image is
          // fresh again and isn't revalidated on every build (RFC 9111 4.3.4)
          const newCacheControl = resp.headers.get('Cache-Control');
          const meta = { ...dataFromCache.meta };
          for (const [key, value] of Object.entries(
            cacheMetaFromHeaders(resp.headers)
          )) {
            if (value) meta[key] = value;
          }
          if (newCacheControl) meta.CacheControl = parse(newCacheControl);
          await addToCache(state, 'img-ext', hash, {
            buffer: dataFromCache.buffer,
            meta,
          });
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
    path.join(state.dir, htmlFolder),
    path.join(state.dir, `_jampack/${contentHash}.${ext}`)
  );

  await (state.vfs??fsp).writeFile(path.join(state.dir, htmlFolder, filename), buffer);

  return filename;
}

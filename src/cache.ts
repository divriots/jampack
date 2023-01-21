import hasha from 'hasha';
import path from 'path';
import * as fs from 'fs/promises';
import type { Image, ImageFormat } from './compressors/images.js';
import { VERSION } from './version.js';
import $state from './state.js';

const CACHE_FOLDER = '.jampack/cache';

async function cleanCache() {
  try {
    await fs.rm(CACHE_FOLDER, { recursive: true });
  } catch (e) {
    // Nothing to do, probably not present
  }
}

function computeCacheHash(buffer: Buffer, options?: any) {
  if ($state.args.nocache) {
    return '';
  }

  let hash = `${VERSION}/${hasha(buffer, { algorithm: 'sha256' })}`;
  if (options) {
    hash += '/' + hasha(JSON.stringify(options), { algorithm: 'md5' });
  }
  return hash;
}

function getLocation(hash: string): string {
  return path.join(CACHE_FOLDER, hash);
}

async function getFromCacheCompressImage(
  hash: string
): Promise<Image | undefined> {
  if ($state.args.nocache) {
    return undefined;
  }

  const location = getLocation(hash);

  try {
    const data = await fs.readFile(path.join(location, 'data'));
    const format = JSON.parse(
      (await fs.readFile(path.join(location, 'format'))).toString()
    ) as ImageFormat;

    return { data, format };
  } catch (e) {
    // Problem during cache loading or not in cache
  }

  return undefined;
}

async function addToCacheCompressImage(
  hash: string,
  image: Image
): Promise<void> {
  if ($state.args.nocache) {
    return;
  }

  const location = getLocation(hash);
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(path.join(location, 'data'), image.data);
  await fs.writeFile(
    path.join(location, 'format'),
    JSON.stringify(image.format)
  );
}

export {
  cleanCache,
  computeCacheHash,
  getFromCacheCompressImage,
  addToCacheCompressImage,
};

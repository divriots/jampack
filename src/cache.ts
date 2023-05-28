import hasha from 'hasha';
import path from 'path';
import * as fs from 'fs/promises';
import type { Image, ImageFormat } from './compressors/images.js';
import { VERSION } from './version.js';
import $state from './state.js';

export type Category = 'img' | 'img-ext';
export type CacheData = { buffer: Buffer; meta: any };

const CACHE_FOLDER = '.jampack/cache';
const CACHE_FOLDER_VERSION = CACHE_FOLDER + '/' + VERSION;

async function cleanCache(full: boolean) {
  if (full) {
    try {
      await fs.rm(CACHE_FOLDER, { recursive: true });
    } catch (e) {
      // Nothing to do, probably not present
    }
    return;
  }

  // List versions in cache
  let files: string[];
  try {
    files = await fs.readdir(CACHE_FOLDER);
  } catch (e) {
    // Nothing to do probably no cache available
    return;
  }

  // Delete old cache versions
  await files
    .filter((f) => f !== VERSION)
    .forEach(async (f) =>
      fs.rm(path.join(CACHE_FOLDER, f), { recursive: true })
    );
}

function computeCacheHash(buffer: Buffer, options?: any) {
  if ($state.args.nocache) {
    return '';
  }

  let hash = `${hasha(buffer, { algorithm: 'sha256' })}`;
  if (options) {
    hash += '/' + hasha(JSON.stringify(options), { algorithm: 'md5' });
  }
  return hash;
}

function getLocation(hash: string, category: Category): string {
  return path.join(CACHE_FOLDER_VERSION, category, hash);
}

async function getFromCache(
  category: Category,
  hash: string
): Promise<CacheData | undefined> {
  if ($state.args.nocache) {
    return undefined;
  }

  const location = getLocation(hash, category);

  try {
    const buffer = await fs.readFile(path.join(location, 'data'));
    const meta = JSON.parse(
      (await fs.readFile(path.join(location, 'meta'))).toString()
    );

    return { buffer, meta };
  } catch (e) {
    // Problem during cache loading or not in cache
  }

  return undefined;
}

async function addToCache(
  category: Category,
  hash: string,
  data: CacheData
): Promise<void> {
  if ($state.args.nocache) {
    return;
  }

  const location = getLocation(hash, category);
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(path.join(location, 'data'), data.buffer);
  await fs.writeFile(path.join(location, 'meta'), JSON.stringify(data.meta));
}

export { cleanCache, computeCacheHash, getFromCache, addToCache };

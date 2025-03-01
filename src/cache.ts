import { hashSync as hasha } from 'hasha';
import path from 'path';
import * as fsp from 'fs/promises';
import { GlobalState } from './state.js';
import { CACHE_VERSIONS } from './packagejson.js';

const listOfCategories = ['img', 'img-ext'] as const;

export type Category = (typeof listOfCategories)[number];

export type CacheData = { buffer: Buffer; meta: any };

function getCacheFolder(state: GlobalState): string {
  return state.args.cache_folder || '.jampack/cache';
}

async function cleanCache(state: GlobalState, full?: boolean) {
  const CACHE_FOLDER = getCacheFolder(state);
  const fs = state.vfs ?? fsp;

  if (full) {
    try {
      await fs.rm(CACHE_FOLDER, { recursive: true });
    } catch (e) {
      // Nothing to do, probably not present
    }
    return;
  }

  // Delete old cache category
  let catFolders: string[] = [];
  try {
    catFolders = await fs.readdir(CACHE_FOLDER);
  } catch (e) {
    // No problem
  }

  for (const f of catFolders) {
    // @ts-ignore
    if (!listOfCategories.includes(f))
      fs.rm(path.join(CACHE_FOLDER, f), { recursive: true });
  }

  // Loop cache folders
  for (const cat of listOfCategories) {
    const location = path.join(CACHE_FOLDER, cat);
    // List versions in cache
    let folders: string[];
    try {
      folders = await fs.readdir(location);
    } catch (e) {
      continue;
    }

    // Delete old cache versions
    for (const f of folders) {
      if (f !== CACHE_VERSIONS[cat])
        fs.rm(path.join(location, f), { recursive: true });
    }
  }
}

function computeCacheHash(state: GlobalState, buffer: Buffer, options?: any) {
  if (state.args.nocache) {
    return '';
  }

  let hash = `${hasha(buffer, { algorithm: 'sha256' })}`;
  if (options) {
    hash += '/' + hasha(JSON.stringify(options), { algorithm: 'md5' });
  }
  return hash;
}

function getVersionOfCategory(category: Category): string {
  return CACHE_VERSIONS[category];
}

function getLocation(
  state: GlobalState,
  hash: string,
  category: Category
): string {
  const CACHE_FOLDER = getCacheFolder(state);

  return path.join(
    CACHE_FOLDER,
    category,
    getVersionOfCategory(category),
    hash
  );
}

async function getFromCache(
  state: GlobalState,
  category: Category,
  hash: string
): Promise<CacheData | undefined> {
  if (state.args.nocache) {
    return undefined;
  }
  const fs = state.vfs ?? fsp;

  const location = getLocation(state, hash, category);

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
  state: GlobalState,
  category: Category,
  hash: string,
  data: CacheData
): Promise<void> {
  if (state.args.nocache) {
    return;
  }
  const fs = state.vfs ?? fsp;

  const location = getLocation(state, hash, category);
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(path.join(location, 'data'), data.buffer);
  await fs.writeFile(path.join(location, 'meta'), JSON.stringify(data.meta));
}

export { cleanCache, computeCacheHash, getFromCache, addToCache };

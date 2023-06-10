import hasha from 'hasha';
import path from 'path';
import * as fs from 'fs/promises';
import $state from './state.js';

const listOfCategories = ['img', 'img-ext'] as const;
export type Category = (typeof listOfCategories)[number];

const CACHE_FOLDER = '.jampack/cache';
const CACHE_VERSIONS: Record<string, string> = {
  img: 'v1',
  'img-ext': 'v1',
} satisfies Record<Category, string>;

export type CacheData = { buffer: Buffer; meta: any };

async function cleanCache(full: boolean) {
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

function getVersionOfCategory(category: Category): string {
  return CACHE_VERSIONS[category];
}

function getLocation(hash: string, category: Category): string {
  return path.join(
    CACHE_FOLDER,
    category,
    getVersionOfCategory(category),
    hash
  );
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

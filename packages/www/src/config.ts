import fs from 'fs';
import fm from 'front-matter';

export const SITE = {
  title: 'Jampack',
  description:
    'Optimizes static websites for best user experience and best Core Web Vitals scores.',
  defaultLanguage: 'en_US',
};

export const OPEN_GRAPH = {
  image: {
    src: '/og-image.jpg',
    alt: '',
  },
  twitter: 'divRIOTS',
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
  title: string;
  description: string;
  image?: { src: string; alt: string };
  dir?: 'ltr' | 'rtl';
  ogLocale?: string;
  lang?: string;
  author?: string;
  date?: Date;
};

export const KNOWN_LANGUAGES = {
  English: 'en',
} as const;

export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/divriots/jampack/tree/main/packages/www`;

export const COMMUNITY_INVITE_URL = `https://jampack.divriots.com/chat`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: 'XXXXXXXXXX',
  appId: 'XXXXXXXXXX',
  apiKey: 'XXXXXXXXXX',
};

export type Sidebar = Record<
  (typeof KNOWN_LANGUAGE_CODES)[number],
  Record<string, { text: string; link: string }[]>
>;

export const featuresDirs = [
  'optimize-images',
  'optimize-images-cdn',
  'optimize-images-external',
  'optimize-above-the-fold',
  'embed-small-images',
  'images-max-width',
  'inline-critical-css',
  'video',
  'iframe',
  'prefetch-links',
  'browser-compatibility',
  'compress-all',
  'autofixes',
  'warnings',
];

const getTitle = (file: string): string => {
  // @ts-ignore
  return fm(fs.readFileSync(file, 'utf8')).attributes['title'];
};

export const SIDEBAR: Sidebar = {
  en: {
    'Getting started': [
      { text: 'Introduction', link: '' },
      { text: 'Installation', link: 'installation' },
      { text: 'CLI Options', link: 'cli-options' },
      { text: 'Configuration', link: 'configuration' },
    ],
    Features: featuresDirs.map((dir) => ({
      text: getTitle('./public/features/' + dir + '/index.md'),
      link: 'features/' + dir,
    })),
    Advanced: [{ text: 'Cache', link: 'cache' }],
    Community: [
      { text: 'GitHub', link: 'https://github.com/divriots/jampack' },
      { text: 'Discord', link: 'https://jampack.divriots.com/chat' },
    ],
  },
};

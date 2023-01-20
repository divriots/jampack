import fs from "fs";
import fm from "front-matter";

export const SITE = {
  title: "jampack",
  description: "Your website description.",
  defaultLanguage: "en_US",
};

export const OPEN_GRAPH = {
  image: {
    src: "/og-image.jpg",
    alt: "",
  },
  twitter: "divRIOTS",
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
  title: string;
  description: string;
  layout: string;
  image?: { src: string; alt: string };
  dir?: "ltr" | "rtl";
  ogLocale?: string;
  lang?: string;
};

export const KNOWN_LANGUAGES = {
  English: "en",
} as const;

export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/divriots/jampack/tree/main/packages/www`;

export const COMMUNITY_INVITE_URL = `https://jampack.divriots.com/chat`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: "XXXXXXXXXX",
  appId: "XXXXXXXXXX",
  apiKey: "XXXXXXXXXX",
};

export type Sidebar = Record<
  typeof KNOWN_LANGUAGE_CODES[number],
  Record<string, { text: string; link: string }[]>
>;

// const featuresDirs = fs.readdirSync( './public/features', { withFileTypes: true })
//   .filter(dirent => dirent.isDirectory())
//   .map(dirent => dirent.name);

export const featuresDirs = [
  "optimize-above-the-fold",
  "optimize-images-to-webp",
  "optimize-svg",
  "responsive-images",
  "set-image-dimensions",
  "lazy-load-images",
  "embed-small-images",
  "compress-all",
  "warnings",
];

const getTitle = (file: string) => {
  return fm(fs.readFileSync(file, "utf8")).attributes["title"];
};

export const SIDEBAR: Sidebar = {
  en: {
    "Getting started": [{ text: "Introduction", link: "" }],
    Reference: [
      { text: "Installation", link: "installation" },
      { text: "CLI Options", link: "cli-options" },
      { text: "Configuration", link: "configuration" },
      { text: "Cache", link: "cache" },
    ],
    Features: featuresDirs.map((dir) => ({
      text: getTitle("./public/features/" + dir + "/index.md"),
      link: "features/" + dir,
    })),
    Community: [
      { text: "Chat with us", link: "https://jampack.divriots.com/chat" },
    ],
  },
};

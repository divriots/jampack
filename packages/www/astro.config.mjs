import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    // Enable Preact to support Preact JSX components.
    preact(),
    mdx(),
  ],
  site: `https://jampack.divRIOTS.com`,
});

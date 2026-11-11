import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  'devlog': defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/devlog' }),
    schema: z.object({
      title: z.string(),
      date: z.date(),
      author: z.array(z.string()),
    }),
  }),
};

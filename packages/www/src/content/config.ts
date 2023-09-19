import { z, defineCollection } from 'astro:content';

export const collections = {
  'devlog': defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      date: z.date(),
      author: z.array(z.string()),
    }),
  }),
};

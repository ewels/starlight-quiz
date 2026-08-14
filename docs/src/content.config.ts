import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';
// `z` re-exported from `astro:content` is deprecated in Astro 7.
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    // `pageActions` is read by starlight-page-actions but not added to the schema
    // by the plugin, so declare it here to use it in frontmatter.
    schema: docsSchema({ extend: z.object({ pageActions: z.boolean().optional() }) }),
  }),
};

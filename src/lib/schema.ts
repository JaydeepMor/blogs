import { z } from 'astro/zod';
import { CATEGORY_SLUGS, GLYPHS } from './categories';

export const postSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  tags: z.array(z.string()).default([]),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  readMinutes: z.number().int().positive(),
  cover: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('glyph'), value: z.enum(GLYPHS) }),
    z.object({ kind: z.literal('image'), value: z.string().min(1) }),
    z.object({ kind: z.literal('flow'), value: z.string().min(1) }),
  ]),
  html: z.string(),
  sources: z
    .array(z.object({ title: z.string().min(1), url: z.string().url(), kind: z.enum(['official', 'secondary']) }))
    .default([]),
  disclaimer: z.boolean().default(false),
});

/** A post as used by pages. `slug` always comes from the file name. */
export type PostData = Omit<z.infer<typeof postSchema>, 'slug'> & { slug: string };

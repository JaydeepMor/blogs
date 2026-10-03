import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema } from './lib/schema';

const posts = defineCollection({
  loader: glob({ pattern: '*.json', base: process.env.POSTS_DIR ?? './src/content/posts' }),
  schema: postSchema,
});

export const collections = { posts };

import { getCollection } from 'astro:content';
import { sortNewestFirst } from './posts';
import type { PostData } from './schema';

/** All published posts, newest first. The slug is the file name. */
export async function getPosts(): Promise<PostData[]> {
  const entries = await getCollection('posts');
  return sortNewestFirst(entries.map((entry) => ({ ...entry.data, slug: entry.id })));
}

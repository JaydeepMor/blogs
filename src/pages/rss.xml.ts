import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { categoryBySlug } from '../lib/categories';
import { getPosts } from '../lib/content';
import { withBase } from '../lib/posts';

export async function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL;
  const posts = await getPosts();
  return rss({
    title: 'Jaydeep Mor · Engineering Notes',
    description: 'Clear, visual notes on backend, cloud, security and AI.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: post.publishedAt,
      link: withBase(`posts/${post.slug}/`, base),
      categories: [categoryBySlug(post.category).label, ...post.tags],
    })),
  });
}

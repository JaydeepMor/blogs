import type { PostData } from './schema';

export function sortNewestFirst(posts: PostData[]): PostData[] {
  return [...posts].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export function splitFeatured(posts: PostData[]): { featured: PostData | null; rest: PostData[] } {
  if (posts.length === 0) return { featured: null, rest: [] };
  return { featured: posts[0], rest: posts.slice(1) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "28 Sep 2026", in UTC. A fixed month list, because ICU data differs between Node versions ("Sep" vs "Sept"). */
export function formatDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Join the site base path and a site-relative path with exactly one slash. */
export function withBase(path: string, base: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** Table of contents: every <h2> that carries an id. */
export function extractToc(html: string): { id: string; text: string }[] {
  const toc: { id: string; text: string }[] = [];
  for (const match of html.matchAll(/<h2\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
    const text = match[2]
      .replace(/<\/span>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e])
      .replace(/\s+/g, ' ')
      .trim();
    toc.push({ id: match[1], text });
  }
  return toc;
}

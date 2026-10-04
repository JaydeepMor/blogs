import type { PostData } from './schema';
import { withBase } from './posts';

export const SITE_NAME = 'Jaydeep Mor · Engineering Notes';
export const AUTHOR = {
  name: 'Jaydeep Mor',
  jobTitle: 'Senior Backend Developer',
  sameAs: ['https://www.linkedin.com/in/jaydeep-mor', 'https://github.com/JaydeepMor'],
};
export const DEFAULT_IMAGE = 'og-default.png';

/** Absolute URL for a site-relative path, a base-prefixed path, or an already absolute URL. */
export function absoluteUrl(path: string, site: string, base: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const prefix = `${base.replace(/\/+$/, '')}/`;
  const rel = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  return new URL(withBase(rel, base), site).href;
}

export function personLd(site: string, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    url: absoluteUrl('about/', site, base),
    sameAs: AUTHOR.sameAs,
  };
}

export function websiteLd(site: string, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('', site, base),
    inLanguage: 'en',
    author: { '@type': 'Person', name: AUTHOR.name, url: absoluteUrl('about/', site, base) },
  };
}

export function postImage(post: PostData, site: string, base: string): string {
  return post.cover.kind === 'image' ? absoluteUrl(post.cover.value, site, base) : absoluteUrl(DEFAULT_IMAGE, site, base);
}

export function blogPostingLd(post: PostData, { site, base, categoryLabel }: { site: string; base: string; categoryLabel: string }) {
  const url = absoluteUrl(`posts/${post.slug}/`, site, base);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: url,
    url,
    image: postImage(post, site, base),
    keywords: post.tags.join(', '),
    articleSection: categoryLabel,
    inLanguage: 'en',
    author: { '@type': 'Person', name: AUTHOR.name, url: absoluteUrl('about/', site, base) },
    publisher: { '@type': 'Person', name: AUTHOR.name, url: absoluteUrl('about/', site, base) },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], site: string, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absoluteUrl(item.path, site, base) })),
  };
}

/** JSON for a <script type="application/ld+json"> block, with <, > and & escaped so it cannot end the script. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

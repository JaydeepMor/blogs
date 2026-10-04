import { describe, expect, it } from 'vitest';
import { absoluteUrl, blogPostingLd, breadcrumbLd, jsonLdScript, personLd, websiteLd } from '../src/lib/seo';
import type { PostData } from '../src/lib/schema';

const site = 'https://jaydeepmor.github.io';
const base = '/blogs';
const post: PostData = {
  slug: 'mcp-auth', title: 'How MCP authorization works', summary: 'One line.', category: 'security', tags: ['MCP', 'OAuth'],
  publishedAt: new Date('2026-10-04T10:00:00Z'), updatedAt: new Date('2026-10-05T10:00:00Z'), readMinutes: 9,
  cover: { kind: 'image', value: '/blogs/media/mcp-auth/cover.png' }, html: '<p>x</p>', sources: [], disclaimer: false,
};

describe('absoluteUrl', () => {
  it('joins site, base and path into one absolute URL', () => {
    expect(absoluteUrl('posts/a/', site, base)).toBe('https://jaydeepmor.github.io/blogs/posts/a/');
    expect(absoluteUrl('', site, base)).toBe('https://jaydeepmor.github.io/blogs/');
    expect(absoluteUrl('/blogs/media/x.png', site, base)).toBe('https://jaydeepmor.github.io/blogs/media/x.png');
    expect(absoluteUrl('https://cdn.example.com/a.png', site, base)).toBe('https://cdn.example.com/a.png');
  });
});

describe('structured data', () => {
  it('describes a post as a BlogPosting with dates, author, image and keywords', () => {
    const ld = blogPostingLd(post, { site, base, categoryLabel: 'Security' });
    expect(ld).toMatchObject({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: 'How MCP authorization works', description: 'One line.',
      datePublished: '2026-10-04T10:00:00.000Z', dateModified: '2026-10-05T10:00:00.000Z',
      mainEntityOfPage: 'https://jaydeepmor.github.io/blogs/posts/mcp-auth/',
      image: 'https://jaydeepmor.github.io/blogs/media/mcp-auth/cover.png',
      keywords: 'MCP, OAuth', articleSection: 'Security', inLanguage: 'en',
      author: { '@type': 'Person', name: 'Jaydeep Mor', url: 'https://jaydeepmor.github.io/blogs/about/' },
    });
  });

  it('falls back to the default share image when the post has no image cover', () => {
    const ld = blogPostingLd({ ...post, cover: { kind: 'glyph', value: 'shield' } }, { site, base, categoryLabel: 'Security' });
    expect(ld.image).toBe('https://jaydeepmor.github.io/blogs/og-default.png');
  });

  it('describes the person with their public profiles', () => {
    expect(personLd(site, base)).toMatchObject({
      '@type': 'Person', name: 'Jaydeep Mor', jobTitle: 'Senior Backend Developer',
      sameAs: ['https://www.linkedin.com/in/jaydeep-mor', 'https://github.com/JaydeepMor'],
    });
  });

  it('describes the site and the breadcrumb trail', () => {
    expect(websiteLd(site, base)).toMatchObject({ '@type': 'WebSite', url: 'https://jaydeepmor.github.io/blogs/', inLanguage: 'en' });
    const crumbs = breadcrumbLd([{ name: 'Blogs', path: '' }, { name: 'Security', path: 'category/security/' }, { name: 'How MCP authorization works', path: 'posts/mcp-auth/' }], site, base);
    expect(crumbs.itemListElement.map((i: any) => [i.position, i.item])).toEqual([
      [1, 'https://jaydeepmor.github.io/blogs/'], [2, 'https://jaydeepmor.github.io/blogs/category/security/'], [3, 'https://jaydeepmor.github.io/blogs/posts/mcp-auth/'],
    ]);
  });

  it('serialises JSON-LD so it cannot close the script tag early', () => {
    const out = jsonLdScript({ headline: 'a </script><script>alert(1)</script> & b' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&')).headline).toBe('a </script><script>alert(1)</script> & b');
  });
});

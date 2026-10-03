import { describe, expect, it } from 'vitest';
import { assetUrl, extractToc, formatDate, sortNewestFirst, splitFeatured, withBase } from '../src/lib/posts';
import type { PostData } from '../src/lib/schema';

const post = (slug: string, date: string): PostData => ({
  slug, title: slug, summary: 's', category: 'backend', tags: [],
  publishedAt: new Date(date), updatedAt: new Date(date), readMinutes: 5,
  cover: { kind: 'glyph', value: 'loop' }, html: '', sources: [], disclaimer: false,
});

describe('sortNewestFirst', () => {
  it('orders by publishedAt descending without mutating the input', () => {
    const input = [post('old', '2026-01-01'), post('new', '2026-09-01'), post('mid', '2026-05-01')];
    expect(sortNewestFirst(input).map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
    expect(input[0].slug).toBe('old');
  });
});

describe('splitFeatured', () => {
  it('returns null and an empty list when there are no posts', () => {
    expect(splitFeatured([])).toEqual({ featured: null, rest: [] });
  });
  it('takes the first post as featured', () => {
    const [a, b, c] = [post('a', '2026-03-01'), post('b', '2026-02-01'), post('c', '2026-01-01')];
    const result = splitFeatured([a, b, c]);
    expect(result.featured?.slug).toBe('a');
    expect(result.rest.map((p) => p.slug)).toEqual(['b', 'c']);
  });
});

describe('formatDate', () => {
  it('formats as day, short month, year in UTC', () => {
    expect(formatDate(new Date('2026-09-28T23:30:00Z'))).toBe('28 Sep 2026');
    expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('1 Jan 2026');
  });
});

describe('withBase', () => {
  it('joins base and path with exactly one slash', () => {
    expect(withBase('posts/a/', '/blogs')).toBe('/blogs/posts/a/');
    expect(withBase('/posts/a/', '/blogs/')).toBe('/blogs/posts/a/');
    expect(withBase('', '/blogs')).toBe('/blogs/');
    expect(withBase('rss.xml', '/')).toBe('/rss.xml');
  });
});

describe('extractToc', () => {
  it('collects h2 headings that have an id and strips inner tags', () => {
    const html = '<h2 id="s1"><span class="step-no">1</span>Create a schema</h2><p>x</p><h2>No id</h2><h2 id="sources">Sources</h2>';
    expect(extractToc(html)).toEqual([
      { id: 's1', text: '1 Create a schema' },
      { id: 'sources', text: 'Sources' },
    ]);
  });
  it('returns an empty list for html without headings', () => {
    expect(extractToc('<p>text</p>')).toEqual([]);
  });
  it('decodes the common entities in heading text', () => {
    expect(extractToc('<h2 id="a">JWT &amp; cookies</h2>')).toEqual([{ id: 'a', text: 'JWT & cookies' }]);
  });
});

describe('assetUrl', () => {
  it('prefixes a site-relative path with the base', () => {
    expect(assetUrl('media/a/cover.png', '/blogs/')).toBe('/blogs/media/a/cover.png');
  });
  it('leaves a path that already starts with the base unchanged', () => {
    expect(assetUrl('/blogs/media/a/cover.png', '/blogs/')).toBe('/blogs/media/a/cover.png');
    expect(assetUrl('/blogs/media/a/cover.png', '/blogs')).toBe('/blogs/media/a/cover.png');
  });
});

import { describe, expect, it } from 'vitest';
import { postSchema } from '../src/lib/schema';
import { CATEGORIES, categoryBySlug } from '../src/lib/categories';

const valid = {
  title: 'A post',
  summary: 'One line.',
  category: 'backend',
  publishedAt: '2026-09-28T10:00:00Z',
  updatedAt: '2026-09-28T10:00:00Z',
  readMinutes: 8,
  cover: { kind: 'glyph', value: 'loop' },
  html: '<p>Hello</p>',
};

describe('postSchema', () => {
  it('accepts a minimal valid post and applies defaults', () => {
    const post = postSchema.parse(valid);
    expect(post.tags).toEqual([]);
    expect(post.sources).toEqual([]);
    expect(post.disclaimer).toBe(false);
    expect(post.publishedAt).toBeInstanceOf(Date);
  });

  it('rejects an unknown category', () => {
    expect(() => postSchema.parse({ ...valid, category: 'gardening' })).toThrow();
  });

  it('rejects an unknown glyph', () => {
    expect(() => postSchema.parse({ ...valid, cover: { kind: 'glyph', value: 'rocket' } })).toThrow();
  });

  it('accepts image and flow covers', () => {
    expect(postSchema.parse({ ...valid, cover: { kind: 'image', value: 'media/a/cover.png' } }).cover.kind).toBe('image');
    expect(postSchema.parse({ ...valid, cover: { kind: 'flow', value: '{}' } }).cover.kind).toBe('flow');
  });

  it('rejects a source without a valid url', () => {
    expect(() => postSchema.parse({ ...valid, sources: [{ title: 'x', url: 'not a url', kind: 'official' }] })).toThrow();
  });

  it('rejects zero or fractional read minutes', () => {
    expect(() => postSchema.parse({ ...valid, readMinutes: 0 })).toThrow();
    expect(() => postSchema.parse({ ...valid, readMinutes: 2.5 })).toThrow();
  });
});

describe('categories', () => {
  it('has the six categories with AI & SI last', () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual(['backend', 'fullstack', 'devops', 'security', 'compliance', 'ai']);
    expect(categoryBySlug('ai').label).toBe('AI & SI');
  });

  it('throws on an unknown slug', () => {
    expect(() => categoryBySlug('nope')).toThrow('Unknown category: nope');
  });
});

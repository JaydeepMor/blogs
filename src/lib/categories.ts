export const GLYPHS = ['flow', 'shield', 'layers', 'loop', 'doc', 'spark'] as const;
export type Glyph = (typeof GLYPHS)[number];

export const CATEGORIES = [
  { slug: 'backend', label: 'Backend', glyph: 'loop' },
  { slug: 'fullstack', label: 'Fullstack', glyph: 'flow' },
  { slug: 'devops', label: 'DevOps', glyph: 'layers' },
  { slug: 'security', label: 'Security', glyph: 'shield' },
  { slug: 'compliance', label: 'Compliance', glyph: 'doc' },
  { slug: 'ai', label: 'AI & SI', glyph: 'spark' },
] as const satisfies ReadonlyArray<{ slug: string; label: string; glyph: Glyph }>;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function categoryBySlug(slug: string) {
  const found = CATEGORIES.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown category: ${slug}`);
  return found;
}

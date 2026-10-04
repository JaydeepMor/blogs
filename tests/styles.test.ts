import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/site.css', import.meta.url), 'utf8');

describe('site.css', () => {
  it('never hides the search input, so search works on phones', () => {
    expect(css).not.toMatch(/\.search input\s*\{[^}]*display:\s*none/);
  });

  it('lets grid columns shrink below their content on small screens, so long code never widens the page', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 900px)'));
    expect(mobile).toMatch(/\.article-layout\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).not.toMatch(/grid-template-columns:\s*1fr\s*;/);
  });

  it('fits the header on a 320px phone', () => {
    const start = css.indexOf('@media (max-width: 380px)');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf('@media', start + 10));
    expect(block).toMatch(/\.search\s*\{[^}]*width:\s*\d+px/);
  });

  it('wraps long inline code inside paragraphs instead of widening the page', () => {
    expect(css).toMatch(/\.prose :not\(pre\) > code\s*\{[^}]*overflow-wrap:\s*anywhere/);
  });
});


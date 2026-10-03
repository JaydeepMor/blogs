import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/site.css', import.meta.url), 'utf8');

describe('site.css', () => {
  it('never hides the search input, so search works on phones', () => {
    expect(css).not.toMatch(/\.search input\s*\{[^}]*display:\s*none/);
  });
});

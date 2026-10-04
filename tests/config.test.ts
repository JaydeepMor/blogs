import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASE, SITE } from '../site.config.mjs';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('site address', () => {
  it('is defined once and used by the Astro config and the build checker', () => {
    expect(SITE).toBe('https://jaydeepmor.github.io');
    expect(BASE).toBe('/blogs');
    for (const file of ['../astro.config.mjs', '../scripts/check-dist.mjs']) {
      expect(read(file), file).toMatch(/from '\.\.?\/(\.\.\/)?site\.config\.mjs'|from '\.\/site\.config\.mjs'/);
      expect(read(file), file).not.toContain("'/blogs");
    }
  });
});

describe('deploy workflow', () => {
  it('gives Pages write access only to the deploy job', () => {
    const wf = read('../.github/workflows/deploy.yml');
    const top = wf.slice(0, wf.indexOf('jobs:'));
    expect(top).not.toMatch(/pages: write/);
    const deploy = wf.slice(wf.indexOf('  deploy:'));
    expect(deploy).toMatch(/pages: write/);
    expect(deploy).toMatch(/id-token: write/);
    const test = wf.slice(wf.indexOf('  test:'), wf.indexOf('  build:'));
    expect(test).not.toMatch(/concurrency/);
  });
});

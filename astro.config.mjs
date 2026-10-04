import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { BASE, SITE } from './site.config.mjs';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [sitemap()],
});

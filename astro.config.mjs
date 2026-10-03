import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jaydeepmor.github.io',
  base: '/blogs',
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [sitemap()],
});

// Checks a built site: required pages exist and every internal URL stays under /blogs/ and resolves.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [dir, flag] = process.argv.slice(2);
const expectEmpty = flag === '--expect-empty';
const BASE = '/blogs/';
const errors = [];

if (!dir || !existsSync(dir)) {
  console.error(`check-dist: directory not found: ${dir}`);
  process.exit(1);
}

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

const required = ['index.html', 'category/backend/index.html', 'category/fullstack/index.html', 'category/devops/index.html',
  'category/security/index.html', 'category/compliance/index.html', 'category/ai/index.html'];
for (const optional of ['about/index.html', '404.html', 'rss.xml']) {
  if (existsSync(join(dir, optional)) || process.env.CHECK_ALL_PAGES === '1') required.push(optional);
}
for (const file of required) {
  if (!existsSync(join(dir, file))) errors.push(`missing page: ${file}`);
}

const pages = walk(dir).filter((f) => f.endsWith('.html') && !f.includes(`${dir}/pagefind/`));
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const match of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const url = match[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:|#)/.test(url)) continue;
    if (!url.startsWith(BASE)) {
      errors.push(`${page}: internal URL outside ${BASE}: "${url}"`);
      continue;
    }
    const rel = decodeURIComponent(url.slice(BASE.length).split(/[?#]/)[0]);
    const target = join(dir, rel);
    const ok = rel === '' || (existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html'))));
    if (!ok) errors.push(`${page}: broken link "${url}"`);
  }
}

const home = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
const postPages = existsSync(join(dir, 'posts')) ? readdirSync(join(dir, 'posts')) : [];
if (expectEmpty) {
  if (!home.includes('No posts yet.')) errors.push('empty build: home page does not show "No posts yet."');
  if (postPages.length > 0) errors.push(`empty build: unexpected post pages: ${postPages.join(', ')}`);
} else {
  if (!home.includes('class="featured"')) errors.push('home page has no featured post');
  if (home.includes('No posts yet.')) errors.push('home page shows the empty state although posts exist');
}

if (errors.length > 0) {
  console.error(`check-dist: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`check-dist: ok (${pages.length} pages checked in ${dir})`);

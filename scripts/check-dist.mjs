// Checks a built site: required pages exist and every internal URL stays under /blogs/ and resolves.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { BASE as SITE_BASE, SITE } from '../site.config.mjs';

const [dir, flag] = process.argv.slice(2);
const expectEmpty = flag === '--expect-empty';
const BASE = `${SITE_BASE}/`;
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

// Search engine ownership files (e.g. google<token>.html) are plain text served as-is, not pages.
const isVerificationFile = (f) => /\/google[0-9a-f]+\.html$/.test(f);
const pages = walk(dir).filter((f) => f.endsWith('.html') && !f.includes(`${dir}/pagefind/`) && !isVerificationFile(f));
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

// SEO: every indexable page has one self-referencing canonical URL, a description, social preview tags
// and valid structured data. The not-found page must not be indexed.
const SITE_ROOT = `${SITE}${BASE}`;
const attr = (html, re) => (html.match(re) ?? [])[1];
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = page.slice(dir.length + 1);
  if (rel === '404.html') {
    if (!/<meta name="robots" content="noindex/.test(html)) errors.push('404.html: missing <meta name="robots" content="noindex">');
    continue;
  }
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  const expected = SITE_ROOT + rel.replace(/index\.html$/, '');
  if (canonicals.length !== 1) errors.push(`${rel}: expected one canonical link, found ${canonicals.length}`);
  else if (canonicals[0] !== expected) errors.push(`${rel}: canonical is ${canonicals[0]}, expected ${expected}`);
  for (const [name, re] of [
    ['meta description', /<meta name="description" content="([^"]+)"/],
    ['og:title', /<meta property="og:title" content="([^"]+)"/],
    ['og:description', /<meta property="og:description" content="([^"]+)"/],
    ['og:url', /<meta property="og:url" content="([^"]+)"/],
    ['og:image', /<meta property="og:image" content="(https:\/\/[^"]+)"/],
    ['twitter:card', /<meta name="twitter:card" content="([^"]+)"/],
  ]) {
    if (!attr(html, re)) errors.push(`${rel}: missing ${name}`);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (blocks.length === 0) errors.push(`${rel}: no JSON-LD structured data`);
  for (const b of blocks) {
    try {
      JSON.parse(b);
    } catch {
      errors.push(`${rel}: JSON-LD is not valid JSON`);
    }
  }
  if (rel.startsWith('posts/') && !blocks.some((b) => b.includes('"BlogPosting"'))) errors.push(`${rel}: post page has no BlogPosting data`);
}
// Accessibility and search hygiene on every page.
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = page.slice(dir.length + 1);
  if (!/<a class="skip-link" href="#main"/.test(html) || !/<main[^>]*id="main"/.test(html)) errors.push(`${rel}: missing skip link to #main`);
  if (/id="search-results"/.test(html) && !/id="search-results"[^>]*aria-live="polite"/.test(html)) errors.push(`${rel}: search results are not announced (aria-live)`);
  if (/id="search-input"/.test(html) && !/id="search-input"[^>]*aria-controls="search-results"/.test(html)) errors.push(`${rel}: search input lacks aria-controls`);
  if (/@import url\("https:\/\/fonts/.test(html)) errors.push(`${rel}: fonts loaded through a blocking @import`);
  for (const m of html.matchAll(/<pre class="mermaid"([^>]*)>/g)) if (!m[1].includes('data-pagefind-ignore')) errors.push(`${rel}: Mermaid source would be indexed by search`);
}
for (const css of walk(dir).filter((f) => f.endsWith('.css'))) {
  if (/@import url\("https:\/\/fonts/.test(readFileSync(css, 'utf8'))) errors.push(`${css.slice(dir.length + 1)}: fonts loaded through a blocking @import`);
}
// Only posts belong in the search index (an empty site must not index About or the 404 page).
const fragDir = join(dir, 'pagefind', 'fragment');
if (existsSync(fragDir)) {
  for (const file of readdirSync(fragDir)) {
    const text = gunzipSync(readFileSync(join(fragDir, file))).toString('utf8');
    const url = JSON.parse(text.slice(text.indexOf('{'))).url;
    if (!/^\/posts\//.test(url)) errors.push(`search index: non-post page indexed: ${url}`);
  }
}

if (existsSync(join(dir, 'rss.xml'))) {
  const channel = readFileSync(join(dir, 'rss.xml'), 'utf8').match(/<channel>[\s\S]*?<link>([^<]+)<\/link>/);
  if (!channel || channel[1] !== SITE_ROOT) errors.push(`rss.xml: channel link is ${channel?.[1]}, expected ${SITE_ROOT}`);
}
if (!existsSync(join(dir, 'og-default.png'))) errors.push('missing og-default.png share image');

// Search results link to the URLs stored in the Pagefind index.
const fragments = join(dir, 'pagefind', 'fragment');
if (existsSync(fragments)) {
  for (const file of readdirSync(fragments)) {
    const text = gunzipSync(readFileSync(join(fragments, file))).toString('utf8');
    // Pagefind's browser code prefixes result URLs with the folder it was loaded from (/blogs/),
    // so the index must store site-relative URLs, and base + URL must be a real page.
    const url = JSON.parse(text.slice(text.indexOf('{'))).url;
    if (url.startsWith(BASE)) errors.push(`search index: URL "${url}" already contains ${BASE}; results would link to ${BASE}${url.slice(1)}`);
    const target = join(dir, url.replace(/^\/+/, ''));
    if (!existsSync(join(target, 'index.html')) && !existsSync(target)) errors.push(`search index: "${url}" does not resolve to a page`);
  }
}

const home = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
const postPages = existsSync(join(dir, 'posts')) ? readdirSync(join(dir, 'posts')) : [];
// An empty site is valid (every post can be moved back to draft). The home page must match what was built.
if (expectEmpty && postPages.length > 0) errors.push(`empty build: unexpected post pages: ${postPages.join(', ')}`);
if (postPages.length === 0) {
  if (!home.includes('No posts yet.')) errors.push('no posts were built, but the home page does not show "No posts yet."');
} else {
  if (!home.includes('class="featured"')) errors.push('home page has no featured post');
  if (home.includes('No posts yet.')) errors.push('home page shows the empty state although posts exist');
}

if (errors.length > 0) {
  console.error(`check-dist: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`check-dist: ok (${pages.length} pages checked in ${dir})`);

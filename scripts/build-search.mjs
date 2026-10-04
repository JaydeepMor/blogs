// Builds the Pagefind search index for dist/ with every URL under the site base path.
// The Pagefind CLI has no base-path option, so pages are added one by one with their public URL.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import * as pagefind from 'pagefind';

const DIST = process.argv[2] ?? 'dist';
const BASE = '/blogs/';

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

const { index, errors } = await pagefind.createIndex({});
if (!index) throw new Error(`pagefind: ${errors.join('; ')}`);

let added = 0;
for (const file of walk(DIST)) {
  if (!file.endsWith('.html') || file.startsWith(join(DIST, 'pagefind') + sep)) continue;
  if (/(^|\/)google[0-9a-f]+\.html$/.test(file)) continue; // search engine ownership file, not a page
  const rel = relative(DIST, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
  const result = await index.addHTMLFile({ url: BASE + rel, content: readFileSync(file, 'utf8') });
  if (result.errors.length) throw new Error(`pagefind: ${file}: ${result.errors.join('; ')}`);
  added++;
}

const written = await index.writeFiles({ outputPath: join(DIST, 'pagefind') });
if (written.errors.length) throw new Error(`pagefind: ${written.errors.join('; ')}`);
await pagefind.close();
console.log(`search: indexed ${added} html files into ${DIST}/pagefind`);

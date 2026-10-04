// Builds the Pagefind search index for dist/, one page at a time, skipping files that are not pages.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import * as pagefind from 'pagefind';

const DIST = process.argv[2] ?? 'dist';

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

const { index, errors } = await pagefind.createIndex({});
if (!index) throw new Error(`pagefind: ${errors.join('; ')}`);

let added = 0;
for (const file of walk(DIST)) {
  if (!file.endsWith('.html') || file.startsWith(join(DIST, 'pagefind') + sep)) continue;
  if (/(^|\/)google[0-9a-f]+\.html$/.test(file)) continue; // search engine ownership file, not a page
  const rel = relative(DIST, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
  // Site-relative URL: Pagefind's browser code adds the folder it was loaded from (/blogs/) itself.
  const result = await index.addHTMLFile({ url: '/' + rel, content: readFileSync(file, 'utf8') });
  if (result.errors.length) throw new Error(`pagefind: ${file}: ${result.errors.join('; ')}`);
  added++;
}

const written = await index.writeFiles({ outputPath: join(DIST, 'pagefind') });
if (written.errors.length) throw new Error(`pagefind: ${written.errors.join('; ')}`);
await pagefind.close();
console.log(`search: indexed ${added} html files into ${DIST}/pagefind`);

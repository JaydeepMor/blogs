import { latestOnly } from '../lib/latest';

const input = document.querySelector<HTMLInputElement>('#search-input');
const requests = latestOnly();
const panel = document.querySelector<HTMLElement>('#search-results');
const base = document.documentElement.dataset.base ?? '/';

type Pagefind = {
  init(): Promise<void>;
  debouncedSearch(q: string, options?: object, ms?: number): Promise<{ results: { data(): Promise<{ url: string; excerpt: string; meta: { title?: string } }> }[] } | null>;
};

let pagefind: Pagefind | null | undefined;

async function load(): Promise<Pagefind | null> {
  if (pagefind !== undefined) return pagefind;
  try {
    const mod = (await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)) as Pagefind;
    await mod.init();
    pagefind = mod;
  } catch {
    pagefind = null;
  }
  return pagefind;
}

function show(nodes: Node[]) {
  if (!panel || !input) return;
  panel.replaceChildren(...nodes);
  panel.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

function hide() {
  if (!panel || !input) return;
  panel.hidden = true;
  input.setAttribute('aria-expanded', 'false');
}

function message(text: string): Node[] {
  const p = document.createElement('p');
  p.textContent = text;
  return [p];
}

async function search() {
  if (!input || !panel) return;
  const query = input.value.trim();
  const token = requests.next();
  if (!query) {
    requests.cancel();
    hide();
    return;
  }
  const engine = await load();
  if (!requests.isCurrent(token)) return;
  if (!engine) {
    show(message('Search is available on the published site.'));
    return;
  }
  const response = await engine.debouncedSearch(query, {}, 200);
  if (response === null || !requests.isCurrent(token)) return; // a newer keystroke replaced this search
  const items = await Promise.all(response.results.slice(0, 6).map((r) => r.data()));
  if (!requests.isCurrent(token)) return;
  if (items.length === 0) {
    show(message('No posts match.'));
    return;
  }
  show(
    items.map((item) => {
      const link = document.createElement('a');
      link.href = item.url;
      const title = document.createElement('strong');
      title.textContent = item.meta.title ?? 'Untitled';
      const excerpt = document.createElement('span');
      excerpt.innerHTML = item.excerpt; // Pagefind escapes page text and adds only <mark>
      link.append(title, excerpt);
      return link;
    }),
  );
}

if (input && panel) {
  input.addEventListener('focus', load, { once: true });
  input.addEventListener('input', search);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      requests.cancel();
      hide();
    }
  });
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.search-wrap')) hide();
  });
}

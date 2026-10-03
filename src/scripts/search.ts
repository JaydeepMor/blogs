const input = document.querySelector<HTMLInputElement>('#search-input');
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
  if (!panel) return;
  panel.replaceChildren(...nodes);
  panel.hidden = false;
}

function message(text: string): Node[] {
  const p = document.createElement('p');
  p.textContent = text;
  return [p];
}

async function search() {
  if (!input || !panel) return;
  const query = input.value.trim();
  if (!query) {
    panel.hidden = true;
    return;
  }
  const engine = await load();
  if (!engine) {
    show(message('Search is available on the published site.'));
    return;
  }
  const response = await engine.debouncedSearch(query, {}, 200);
  if (response === null) return; // a newer keystroke replaced this search
  const items = await Promise.all(response.results.slice(0, 6).map((r) => r.data()));
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
      panel.hidden = true;
    }
  });
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.search-wrap')) panel.hidden = true;
  });
}

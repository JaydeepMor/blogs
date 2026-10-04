import { parseFlow, renderFlow } from '../lib/flow';

function renderFlows() {
  document.querySelectorAll<HTMLElement>('[data-flow]').forEach((el) => {
    if (el.dataset.rendered) return;
    el.dataset.rendered = '1';
    try {
      el.innerHTML = renderFlow(parseFlow(el.dataset.flow ?? ''));
    } catch {
      el.innerHTML = '<p class="block-error">This diagram could not be displayed.</p>';
    }
  });
}

async function renderMermaid() {
  const nodes = [...document.querySelectorAll<HTMLElement>('pre.mermaid')];
  if (nodes.length === 0) return;
  for (const node of nodes) node.dataset.src ??= node.textContent ?? '';
  const { default: mermaid } = await import('mermaid');
  const dark = document.documentElement.dataset.theme === 'dark';
  const fontFamily = getComputedStyle(document.body).fontFamily;
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', fontFamily, securityLevel: 'strict' });
  for (const node of nodes) {
    node.removeAttribute('data-processed');
    node.classList.remove('mermaid-failed');
    node.textContent = node.dataset.src ?? '';
    try {
      await mermaid.run({ nodes: [node] });
    } catch {
      node.textContent = node.dataset.src ?? '';
      node.classList.add('mermaid-failed');
    }
  }
}

renderFlows();
renderMermaid();
document.addEventListener('themechange', renderMermaid);

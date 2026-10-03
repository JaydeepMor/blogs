import { describe, expect, it } from 'vitest';
import { parseFlow, renderFlow } from '../src/lib/flow';

const spec = {
  width: 400, height: 200, label: 'Demo',
  nodes: [
    { id: 'a', label: 'Client', x: 10, y: 70, w: 100, h: 60 },
    { id: 'b', label: 'API', sub: 'Laravel', x: 200, y: 70, w: 100, h: 60, hot: true },
    { id: 'c', label: 'DB', x: 200, y: 140, w: 100, h: 40 },
  ],
  edges: [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }],
  flows: [{ path: ['a', 'b'] }, { path: ['a', 'c'], color: 'b', dur: 4 }],
};

describe('parseFlow', () => {
  it('parses a valid diagram', () => {
    expect(parseFlow(JSON.stringify(spec)).nodes).toHaveLength(3);
  });
  it('rejects text that is not JSON', () => {
    expect(() => parseFlow('{nope')).toThrow(/^Invalid diagram: not valid JSON/);
  });
  it('rejects a diagram without nodes', () => {
    expect(() => parseFlow(JSON.stringify({ ...spec, nodes: [] }))).toThrow(/^Invalid diagram: needs at least one node/);
  });
  it('rejects an edge that names an unknown node', () => {
    expect(() => parseFlow(JSON.stringify({ ...spec, edges: [{ from: 'a', to: 'zzz' }] }))).toThrow(/^Invalid diagram: unknown node "zzz"/);
  });
  it('rejects a flow with fewer than two stops', () => {
    expect(() => parseFlow(JSON.stringify({ ...spec, flows: [{ path: ['a'] }] }))).toThrow(/^Invalid diagram: a flow needs at least two nodes/);
  });
  it('rejects a node without numeric position', () => {
    expect(() => parseFlow(JSON.stringify({ ...spec, nodes: [{ id: 'a', label: 'A' }] }))).toThrow(/^Invalid diagram: node "a" needs numeric x and y/);
  });
  it('rejects more than 40 nodes', () => {
    const nodes = Array.from({ length: 41 }, (_, i) => ({ id: `n${i}`, label: 'N', x: i, y: 0 }));
    expect(() => parseFlow(JSON.stringify({ ...spec, nodes, edges: [], flows: [] }))).toThrow(/^Invalid diagram: too many nodes/);
  });
});

describe('renderFlow', () => {
  const svg = renderFlow(parseFlow(JSON.stringify(spec)));

  it('draws one box per node and marks the hot one', () => {
    expect(svg.match(/<rect /g)).toHaveLength(3);
    expect(svg.match(/class="dg-box hot"/g)).toHaveLength(1);
  });
  it('draws a straight line between nodes at the same height and a curve otherwise', () => {
    expect(svg).toContain('d="M110 100H200"');
    expect(svg).toContain('d="M110 100C155 100 155 160 200 160"');
  });
  it('animates one dot per flow with its colour, duration and staggered start', () => {
    expect(svg.match(/<animateMotion /g)).toHaveLength(2);
    expect(svg).toContain('class="dg-dot dg-dot-a"');
    expect(svg).toContain('class="dg-dot dg-dot-b"');
    expect(svg).toContain('dur="3s" begin="0s"');
    expect(svg).toContain('dur="4s" begin="2s"');
  });
  it('uses the label for accessibility and the given size', () => {
    expect(svg).toContain('viewBox="0 0 400 200"');
    expect(svg).toContain('role="img" aria-label="Demo"');
  });
  it('escapes text so labels cannot inject markup', () => {
    const evil = { ...spec, label: '"><script>', nodes: [{ id: 'a', label: '<img onerror=x>', x: 0, y: 0 }], edges: [], flows: [] };
    const out = renderFlow(parseFlow(JSON.stringify(evil)));
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img onerror=x&gt;');
  });
  it('passes a dot through intermediate nodes on a multi-stop flow', () => {
    const three = {
      width: 500, height: 100,
      nodes: [{ id: 'a', label: 'A', x: 0, y: 20, w: 100, h: 60 }, { id: 'b', label: 'B', x: 150, y: 20, w: 100, h: 60 }, { id: 'c', label: 'C', x: 300, y: 20, w: 100, h: 60 }],
      edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
      flows: [{ path: ['a', 'b', 'c'] }],
    };
    expect(renderFlow(parseFlow(JSON.stringify(three)))).toContain('path="M100 50H150H250H300"');
  });
});

export interface FlowNode { id: string; label: string; sub?: string; x: number; y: number; w?: number; h?: number; hot?: boolean }
export interface FlowEdge { from: string; to: string }
export interface FlowRoute { path: string[]; color?: 'a' | 'b' | 'c'; dur?: number }
export interface FlowSpec { width: number; height: number; label?: string; nodes: FlowNode[]; edges: FlowEdge[]; flows: FlowRoute[] }

const DEFAULT_W = 110;
const DEFAULT_H = 56;
const MAX_NODES = 40;
const COLORS = ['a', 'b', 'c'];

// Every value that reaches an SVG attribute is checked here, so the renderer never interpolates untrusted strings.
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPos = (v: unknown): v is number => isNum(v) && v > 0;

function fail(message: string): never {
  throw new Error(`Invalid diagram: ${message}`);
}

export function parseFlow(json: string): FlowSpec {
  let raw: any;
  try {
    raw = JSON.parse(json);
  } catch {
    fail('not valid JSON');
  }
  if (!raw || typeof raw !== 'object') fail('not valid JSON');
  const nodes: FlowNode[] = Array.isArray(raw.nodes) ? raw.nodes : [];
  if (nodes.length === 0) fail('needs at least one node');
  if (nodes.length > MAX_NODES) fail('too many nodes');
  const ids = new Set<string>();
  for (const n of nodes) {
    if (typeof n.id !== 'string' || typeof n.label !== 'string') fail('every node needs an id and a label');
    if (!isNum(n.x) || !isNum(n.y)) fail(`node "${n.id}" needs numeric x and y`);
    if ((n.w !== undefined && !isPos(n.w)) || (n.h !== undefined && !isPos(n.h))) fail(`node "${n.id}" has a non-numeric size`);
    ids.add(n.id);
  }
  const known = (id: string) => {
    if (!ids.has(id)) fail(`unknown node "${id}"`);
  };
  const edges: FlowEdge[] = Array.isArray(raw.edges) ? raw.edges : [];
  for (const e of edges) {
    known(e.from);
    known(e.to);
  }
  const flows: FlowRoute[] = Array.isArray(raw.flows) ? raw.flows : [];
  for (const f of flows) {
    if (!Array.isArray(f.path) || f.path.length < 2) fail('a flow needs at least two nodes');
    f.path.forEach(known);
    if (f.color !== undefined && !COLORS.includes(f.color)) fail('flow colour must be a, b or c');
    if (f.dur !== undefined && !isPos(f.dur)) fail('flow duration must be a positive number');
  }
  if ((raw.width !== undefined && !isPos(raw.width)) || (raw.height !== undefined && !isPos(raw.height))) {
    fail('width and height must be positive numbers');
  }
  return {
    width: raw.width ?? 760,
    height: raw.height ?? 300,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    nodes, edges, flows,
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function box(n: FlowNode) {
  return { x: n.x, y: n.y, w: n.w ?? DEFAULT_W, h: n.h ?? DEFAULT_H };
}

/** Path commands from the right edge of `a` to the left edge of `b`. */
function hop(a: FlowNode, b: FlowNode) {
  const A = box(a);
  const B = box(b);
  const sx = A.x + A.w;
  const sy = A.y + A.h / 2;
  const ex = B.x;
  const ey = B.y + B.h / 2;
  const mx = (sx + ex) / 2;
  return {
    start: `M${sx} ${sy}`,
    segment: sy === ey ? `H${ex}` : `C${mx} ${sy} ${mx} ${ey} ${ex} ${ey}`,
    exit: `H${B.x + B.w}`,
  };
}

export function renderFlow(spec: FlowSpec): string {
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  const parts: string[] = [];

  for (const e of spec.edges) {
    const h = hop(byId.get(e.from)!, byId.get(e.to)!);
    parts.push(`<path class="dg-line" d="${h.start}${h.segment}"/>`);
  }

  for (const n of spec.nodes) {
    const b = box(n);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    parts.push(`<rect class="dg-box${n.hot ? ' hot' : ''}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="14"/>`);
    if (n.sub) {
      parts.push(`<text class="dg-text" x="${cx}" y="${cy - 2}" text-anchor="middle">${esc(n.label)}</text>`);
      parts.push(`<text class="dg-sub" x="${cx}" y="${cy + 16}" text-anchor="middle">${esc(n.sub)}</text>`);
    } else {
      parts.push(`<text class="dg-text" x="${cx}" y="${cy + 5}" text-anchor="middle">${esc(n.label)}</text>`);
    }
  }

  spec.flows.forEach((f, i) => {
    const dur = f.dur ?? 3;
    // A negative begin starts each dot part-way along its path, so no dot waits at the SVG origin.
    const begin = -Math.round(((dur * i) / spec.flows.length) * 100) / 100 || 0;
    let path = '';
    for (let s = 0; s < f.path.length - 1; s++) {
      const h = hop(byId.get(f.path[s])!, byId.get(f.path[s + 1])!);
      if (s === 0) path += h.start;
      path += h.segment;
      if (s < f.path.length - 2) path += h.exit;
    }
    parts.push(
      `<circle class="dg-dot dg-dot-${f.color ?? 'a'}" r="7"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`,
    );
  });

  const label = esc(spec.label ?? 'Diagram');
  return `<svg viewBox="0 0 ${spec.width} ${spec.height}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}

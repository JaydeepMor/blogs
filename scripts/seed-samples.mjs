// Writes two sample posts. Run once: npm run seed. The backend owns src/content/posts afterwards.
import { mkdirSync, writeFileSync } from 'node:fs';

const flow = {
  width: 760, height: 290, label: 'Requests travel from the client through the API and tenant resolver to one tenant schema',
  nodes: [
    { id: 'client', label: 'Client', sub: 'JWT', x: 10, y: 115, w: 110, h: 60 },
    { id: 'api', label: 'API', sub: 'Laravel', x: 200, y: 115, w: 110, h: 60 },
    { id: 'resolver', label: 'Tenant resolver', sub: 'SET LOCAL', x: 390, y: 115, w: 130, h: 60, hot: true },
    { id: 'a', label: 'clinic_a', sub: 'schema', x: 620, y: 20, w: 130, h: 56 },
    { id: 'b', label: 'clinic_b', sub: 'schema', x: 620, y: 117, w: 130, h: 56 },
    { id: 'c', label: 'clinic_c', sub: 'schema', x: 620, y: 214, w: 130, h: 56 },
  ],
  edges: [
    { from: 'client', to: 'api' }, { from: 'api', to: 'resolver' },
    { from: 'resolver', to: 'a' }, { from: 'resolver', to: 'b' }, { from: 'resolver', to: 'c' },
  ],
  flows: [
    { path: ['client', 'api', 'resolver', 'a'], color: 'a', dur: 3.6 },
    { path: ['client', 'api', 'resolver', 'b'], color: 'b', dur: 3.6 },
    { path: ['client', 'api', 'resolver', 'c'], color: 'c', dur: 3.6 },
  ],
};

const coverFlow = {
  width: 420, height: 220, label: 'A request routed to one of three tenant schemas',
  nodes: [
    { id: 'api', label: 'API', x: 10, y: 85, w: 90, h: 50 },
    { id: 'resolver', label: 'Resolver', x: 160, y: 85, w: 100, h: 50, hot: true },
    { id: 'a', label: 'clinic_a', x: 320, y: 15, w: 90, h: 44 },
    { id: 'b', label: 'clinic_b', x: 320, y: 88, w: 90, h: 44 },
    { id: 'c', label: 'clinic_c', x: 320, y: 161, w: 90, h: 44 },
  ],
  edges: [{ from: 'api', to: 'resolver' }, { from: 'resolver', to: 'a' }, { from: 'resolver', to: 'b' }, { from: 'resolver', to: 'c' }],
  flows: [
    { path: ['api', 'resolver', 'a'], color: 'a', dur: 2.4 },
    { path: ['api', 'resolver', 'b'], color: 'b', dur: 2.4 },
    { path: ['api', 'resolver', 'c'], color: 'c', dur: 2.4 },
  ],
};

const attr = (obj) => JSON.stringify(obj).replace(/&/g, '&amp;').replace(/'/g, '&#39;');

const tenantHtml = `
<div class="callout"><strong>The short version</strong>Each tenant gets its own schema inside one database. The app reads the tenant from the login token and points the connection at that schema for the length of one transaction.</div>
<p>A multi-tenant app serves many customers from one codebase. The hard part is making sure clinic A can never read clinic B's patients. A schema per tenant sits in the middle of the usual options: stronger isolation than a shared table, far cheaper than a database per customer.</p>
<figure><div class="figure-box"><div class="flow" data-flow='${attr(flow)}'></div></div><figcaption>Each dot is one request. The resolver sends it to exactly one schema.</figcaption></figure>
<h2 id="create-schema"><span class="step-no">1</span>Create one schema per tenant</h2>
<p>A schema is a named folder of tables inside a database. Every tenant gets the same tables, created by the same migration, inside its own folder.</p>
<pre><code><span class="code-label">SQL</span>CREATE SCHEMA clinic_b;
CREATE TABLE clinic_b.patients (
  id   bigserial PRIMARY KEY,
  name text NOT NULL
);</code></pre>
<h2 id="read-tenant"><span class="step-no">2</span>Read the tenant from the token</h2>
<p>The tenant must come from something the user cannot edit. A signed token is the usual choice. Never trust a tenant ID sent in the URL or request body.</p>
<h2 id="search-path"><span class="step-no">3</span>Point the connection at the schema</h2>
<p>PostgreSQL looks up unqualified table names using <code>search_path</code>. Set it inside a transaction and every query in that request lands in the right schema.</p>
<pre><code><span class="code-label">SQL</span>BEGIN;
SET LOCAL search_path = clinic_b;   -- resets at COMMIT
SELECT * FROM patients;             -- reads clinic_b.patients
COMMIT;</code></pre>
<div class="callout warn"><strong>Common mistake</strong>Using plain <code>SET</code> behind a connection pooler. The setting stays on the pooled connection and the next request, from another tenant, inherits it. <code>SET LOCAL</code> ends with the transaction.</div>
<h2 id="whole-request"><span class="step-no">4</span>See the whole request</h2>
<figure><div class="figure-box"><pre class="mermaid">sequenceDiagram
  participant C as Client
  participant A as API
  participant R as Tenant resolver
  participant D as PostgreSQL
  C->>A: Request + JWT
  A->>R: Which tenant?
  R-->>A: clinic_b
  A->>D: BEGIN, SET LOCAL search_path
  A->>D: SELECT * FROM patients
  D-->>A: Rows from clinic_b only
  A-->>C: 200 OK</pre></div><figcaption>The same request as a sequence.</figcaption></figure>
<h2 id="compare"><span class="step-no">5</span>Compare the three options</h2>
<figure><img src="/blogs/media/schema-per-tenant-postgresql/tenancy-options.svg" alt="Three tenancy options: shared table, schema per tenant, database per tenant" loading="lazy"><figcaption>Isolation and cost both rise from left to right.</figcaption></figure>
<h2 id="when-not"><span class="step-no">6</span>When not to use it</h2>
<ul>
<li><strong>Thousands of tenants.</strong> Migrations run once per schema and become slow.</li>
<li><strong>Heavy cross-tenant reporting.</strong> Queries across schemas need unions.</li>
<li><strong>Hard legal separation.</strong> Some contracts demand a database per customer.</li>
</ul>`.trim();

const jwtHtml = `
<div class="callout"><strong>The short version</strong>Use a server-side session in an HTTP-only cookie for a browser app you host yourself. Use short-lived JWTs when separate services must verify a request without calling back to one login server.</div>
<p>Both answer the same question: who is making this request? They differ in where the answer is stored and how you take it back.</p>
<h2 id="where-stored"><span class="step-no">1</span>Where the proof lives</h2>
<p>A session keeps the user's state on the server and gives the browser only a random ID. A JWT carries the claims itself, signed so they cannot be changed.</p>
<h2 id="revoke"><span class="step-no">2</span>How you revoke it</h2>
<p>Deleting a session row logs the user out at once. A JWT stays valid until it expires, so keep its lifetime short and pair it with a refresh token you can revoke.</p>
<h2 id="steal"><span class="step-no">3</span>What an attacker can steal</h2>
<ul>
<li><strong>Cookie marked HttpOnly.</strong> Page scripts cannot read it, which blunts cross-site scripting.</li>
<li><strong>Token in localStorage.</strong> Any injected script can read and send it elsewhere.</li>
<li><strong>Either one over plain HTTP.</strong> Always set the Secure flag and use TLS.</li>
</ul>
<div class="callout warn"><strong>Common mistake</strong>Putting personal data in a JWT payload. The payload is only encoded, not encrypted, and anyone holding the token can read it.</div>`.trim();

const posts = [
  {
    slug: 'schema-per-tenant-postgresql',
    title: 'How schema-per-tenant isolation works in PostgreSQL',
    summary: 'One database, many clinics, zero shared rows. A step-by-step look at routing every request to the right schema.',
    category: 'backend',
    tags: ['PostgreSQL', 'Multi-tenancy', 'Laravel'],
    publishedAt: '2026-09-28T09:00:00Z', updatedAt: '2026-09-28T09:00:00Z', readMinutes: 8,
    cover: { kind: 'flow', value: JSON.stringify(coverFlow) },
    html: tenantHtml,
    sources: [
      { title: 'PostgreSQL documentation: Schemas', url: 'https://www.postgresql.org/docs/current/ddl-schemas.html', kind: 'official' },
      { title: 'PostgreSQL documentation: SET', url: 'https://www.postgresql.org/docs/current/sql-set.html', kind: 'official' },
      { title: 'PgBouncer: features by pooling mode', url: 'https://www.pgbouncer.org/features.html', kind: 'official' },
    ],
    disclaimer: false,
  },
  {
    slug: 'jwt-or-session-cookies',
    title: 'JWT & session cookies: how to choose',
    summary: 'Where each one is stored, how it is revoked, and what an attacker can steal.',
    category: 'security',
    tags: ['Authentication', 'JWT', 'Cookies'],
    publishedAt: '2026-09-10T09:00:00Z', updatedAt: '2026-09-10T09:00:00Z', readMinutes: 5,
    cover: { kind: 'glyph', value: 'shield' },
    html: jwtHtml,
    sources: [
      { title: 'RFC 7519: JSON Web Token', url: 'https://www.rfc-editor.org/rfc/rfc7519', kind: 'official' },
      { title: 'MDN: Using HTTP cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies', kind: 'official' },
      { title: 'OWASP Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html', kind: 'official' },
    ],
    disclaimer: false,
  },
];

mkdirSync('src/content/posts', { recursive: true });
for (const post of posts) writeFileSync(`src/content/posts/${post.slug}.json`, JSON.stringify(post, null, 2) + '\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 220" font-family="system-ui, sans-serif">
<rect width="720" height="220" fill="#f8fafd"/>
<g fill="#ffffff" stroke="#0b57d0" stroke-width="2">
<rect x="30" y="50" width="190" height="120" rx="14"/><rect x="265" y="50" width="190" height="120" rx="14"/><rect x="500" y="50" width="190" height="120" rx="14"/>
</g>
<g fill="#1f1f1f" font-size="17" font-weight="600" text-anchor="middle">
<text x="125" y="100">Shared table</text><text x="360" y="100">Schema per tenant</text><text x="595" y="100">Database per tenant</text>
</g>
<g fill="#5a5f66" font-size="14" text-anchor="middle">
<text x="125" y="128">tenant_id column</text><text x="360" y="128">one schema each</text><text x="595" y="128">one database each</text>
<text x="360" y="205">Isolation and cost rise from left to right</text>
</g>
</svg>
`;
mkdirSync('public/media/schema-per-tenant-postgresql', { recursive: true });
writeFileSync('public/media/schema-per-tenant-postgresql/tenancy-options.svg', svg);
console.log(`seeded ${posts.length} posts`);

# blogs

Source of https://jaydeepmor.github.io/blogs/, a static site built with Astro.

- Posts live in `src/content/posts/<slug>.json` and their media in `public/media/<slug>/`.
  These files are written by a private publishing tool. Do not edit them by hand.
- Media URLs inside a post's `html` are absolute: `/blogs/media/<slug>/<file>`. An image cover's
  `cover.value` may be `media/<slug>/<file>` or `/blogs/media/<slug>/<file>`.
- Animated diagram JSON (`data-flow`, and `flow` covers) must use numbers for sizes and durations and
  `a`, `b` or `c` for colours; anything else shows an error in place of the diagram.
- Source links must use `http` or `https`.
- Requires Node 24 (`nvm use`).

| Command | What it does |
|---|---|
| `npm run dev` | Local preview at http://localhost:4321/blogs/ (search is disabled in dev) |
| `npm test` | Unit tests |
| `npm run build` | Build the site and the search index into `dist/` |
| `npm run check:dist` | Check the built site for broken or mis-prefixed links |
| `npm run test:empty` | Build with zero posts and check the empty state |

Every push to `main` runs the tests and deploys to GitHub Pages.

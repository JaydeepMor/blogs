# blogs

Source of https://jaydeepmor.github.io/blogs/, a static site built with Astro.

- Posts live in `src/content/posts/<slug>.json` and their media in `public/media/<slug>/`.
  These files are written by a private publishing tool. Do not edit them by hand.
- Requires Node 24 (`nvm use`).

| Command | What it does |
|---|---|
| `npm run dev` | Local preview at http://localhost:4321/blogs/ (search is disabled in dev) |
| `npm test` | Unit tests |
| `npm run build` | Build the site and the search index into `dist/` |
| `npm run check:dist` | Check the built site for broken or mis-prefixed links |
| `npm run test:empty` | Build with zero posts and check the empty state |

Every push to `main` runs the tests and deploys to GitHub Pages.

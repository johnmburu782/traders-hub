# Technologies and tools

## Application technologies observed

- HTML5 for five standalone pages.
- CSS in `style.css` for shared layout, responsive rules, themes, and components.
- Vanilla JavaScript in `script.js`, `products.js`, and `dashboard.js`.
- Browser `localStorage` as the client-side data/session store.
- Chart.js 4.4.4 referenced from cdnjs for dashboard chart rendering.
- Google Fonts imported by CSS: Space Grotesk, Inter, and IBM Plex Mono.
- Kenyan shilling (KES) formatting via browser `Intl` APIs.

## Development and verification tools used for this pack

- Git status/source inspection to distinguish existing workspace changes from this evidence-pack addition.
- Node.js `--check` for JavaScript syntax parsing.
- Python standard-library `HTMLParser` and local-path checks for basic HTML/asset inspection.
- A local Python HTTP server was started to attempt a visual browser review. The browser origin gate declined access, so no page screenshots or visual assertions were produced.

No package manager manifest, framework configuration, automated test runner, or backend tooling was found among the inspected project-root files. Tool versions were not recorded; none are asserted here.

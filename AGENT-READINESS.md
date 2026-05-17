# Agent Readiness - Repo Foundry

Status: v1 implemented in the public build pipeline.
Last updated: 2026-05-17.

## Public purpose

Repo Foundry is a public-safe discovery surface for high-signal open-source repositories, release updates, lane maps, snapshots, and Codex-adjacent resources.

The public site is generated from allowlisted content only. It must never expose internal runtime state, local paths, private workspace telemetry, manager notes, session data, or backlog ownership.

## Required schema

- Home: `Organization`, `WebSite`, `WebPage`, and featured repo `ItemList`.
- Repository dossiers: `ProfilePage`, `SoftwareSourceCode`, and `BreadcrumbList`.
- Library, signals, lanes, feed, resources: `CollectionPage`, `ItemList`, and `BreadcrumbList` where applicable.
- Visualisations: `CollectionPage`, `Dataset`, and `BreadcrumbList`.
- About: `AboutPage` and `BreadcrumbList`.
- Contact: `ContactPage` and `BreadcrumbList`.

## Agent-facing requirements

- Every page has a unique title, description, canonical URL, Open Graph tags, and Twitter card tags.
- Every generated page includes valid JSON-LD.
- The build writes `sitemap.xml`, `robots.txt`, and `llms.txt`.
- Interactive controls use semantic `<button>`, `<a>`, `<input>`, `<select>`, and `<textarea>` elements.
- Inputs, selects, and textareas have matching labels or accessible names.
- HUD/Terminal skin toggle and accent picker persist with `localStorage` only.
- No public form submits to a backend in v1.
- No `backdrop-filter` on sticky controls.
- Reduced-motion users receive paused or instant motion.

## Public/private boundary checks

Before release, generated `dist/public/` should be checked for:

- `W:\`
- `C:\`
- `_local`
- `LOCAL-ONLY`
- `manager notes`
- `session state`
- `backlog ownership`

Any match must be reviewed before publishing.

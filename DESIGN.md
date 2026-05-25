# Repo Foundry Design System v2

Status: implemented from the Wireframes v2 handoff.
Supersedes: `design/archive/DESIGN-emerald-foundry-2026-05-17.md`.
Source handoff:

- `design/handoff-2026-05-16/project/handoff/DESIGN-SPEC.md`
- `design/handoff-2026-05-16/project/handoff/TOKENS.md`
- `design/handoff-2026-05-16/project/handoff/MOTION.md`

## Direction

Repo Foundry is a curated, editorial site for high-signal open-source repositories. It is not a SaaS dashboard and not a generic awesome list. The v2 direction is a dark, operator-minded repo discovery surface with two visitor-selectable skins:

- HUD: the default esports/loadout surface.
- Terminal: a dense operator-mode skin over the same content and data.

The visitor can also choose one of five accents. Skin and accent choices persist in `localStorage`.

## Tokens

The canonical token implementation lives in `src/assets/tokens.css`.

No component should hard-code accent colours. Components consume `var(--accent)`, `var(--accent-soft)`, `var(--accent-glow)`, and related custom properties.

## Public routes

The v2 launch surface covers:

- `/`
- `/news/`
- `/about/`
- `/contact/`

Existing public routes remain generated and use the v2 primitives:

- `/trending/`
- `/repos/`
- `/repos/:slug/`
- `/lanes/`
- `/lanes/:laneId/`
- `/visualisations/`
- `/resources/codex/`

## Motion

Motion is short, purposeful, and never decorative for its own sake:

- 180-400ms UI transitions.
- 38s scoreboard ticker.
- Reduced-motion mode pauses or cuts non-essential movement.
- No bounce, confetti, autoplay video, or aggressive parallax.

## Agent readiness

Repo Foundry ships structured data and agent-facing basics from the public build pipeline:

- `Organization` and `WebSite` on the home page.
- `SoftwareSourceCode` on repo dossiers.
- `Dataset` on visualisations.
- `CollectionPage` and `ItemList` on browse surfaces.
- `AboutPage` and `ContactPage` on the appropriate routes.
- `sitemap.xml`, `robots.txt`, and `llms.txt` generated into `dist/public/`.

See `AGENT-READINESS.md` for the release checklist.

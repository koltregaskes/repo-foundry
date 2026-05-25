# Repo Foundry — Design Handoff (v2)

Self-contained bundle for landing the v2 visual direction in the `repo-foundry` codebase. Drop this folder into your repo (e.g. `docs/design/v2/`) or hand it to Claude Code as-is.

## Contents

| File | What it is | Read first if you are… |
|---|---|---|
| `DESIGN-SPEC.md` | The locked design specification — identity, two skins, five accents, four pages, voice | …reviewing what was approved |
| `TOKENS.md` | Design tokens (CSS custom properties) ready to paste into `tokens.css` | …starting implementation |
| `MOTION.md` | Motion philosophy + timing tokens + per-page motion catalogue | …building animation |
| `HANDOFF.md` | Implementation guide — file structure, build order, code snippets, acceptance criteria | …Claude Code |

## Reference visual

The companion file `Repo Foundry Wireframes v2.html` lives in the design project (not this folder). It has all 8 wireframes side-by-side on a pannable canvas:

- 1 intro / brief
- 4 HUD-skin pages (Home · Feed · About · Contact)
- 4 TERMINAL-skin pages (same four)

Open it, double-click any artboard to focus, and use it as the visual reference while building.

## TL;DR for someone landing here cold

- Dark, magenta-accented site for an editorial open-source repo discovery product
- **Two skins** the visitor can toggle: HUD (esports loadout, default) and TERMINAL (windowed terminal, alternate)
- **Five accent colours** the visitor can pick: magenta · blue · green · amber · violet
- Both controls live top-right of every page; persist via `localStorage`; keyboard shortcuts <kbd>T</kbd> and <kbd>1</kbd>–<kbd>5</kbd>
- Four launch pages: Home, Feed, About, Contact. Other routes (`/repos/:slug`, `/lanes`, etc.) follow in v2.1+ using the same primitives.
- Motion is "interesting but not OTT" — short eases, no bounce, no confetti, full `prefers-reduced-motion` respect.

## What this bundle supersedes

- `DESIGN.md` (emerald palette direction) — superseded by `DESIGN-SPEC.md` here
- `CLAUDE-DESIGN-HANDOFF.md` — superseded by `HANDOFF.md` here
- `SCOPE.md` — **still valid**, do not touch

## Done state

Build is complete when every box in `DESIGN-SPEC.md` §9 (acceptance criteria) is ticked and a Lighthouse run on production gives Performance ≥ 90, Accessibility ≥ 95.

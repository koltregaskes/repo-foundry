# Repos Hub — Design System

> Part of the unified Kol Tregaskes portal design system.
> Master specification: `W:\Agent Workspace 2\docs\design\PORTAL-DESIGN-SYSTEM.md`

## Identity

**Name:** Repo Foundry
**Purpose:** Repository intelligence, discovery, and editorial curation for Kol's open-source and private repos.
**Personality:** Technical, precise, code-focused. The repos are the building blocks of the estate — the design should feel like a well-organised code library with editorial curation.

## Theme: Emerald

Emerald signals growth, open source, and technical vitality — fitting for a repository collection.

### Current State (needs major update)
Currently uses a completely different design system: **light theme** with paper/cream tones (`#f5efe2`), Segoe UI + Palatino fonts, burnt orange accent (`#d8662d`). This is the furthest from the shared standard and needs the most work.

Repo Foundry has a sophisticated build system (public + internal variants via `scripts/build-public.mjs` and `scripts/build-internal.mjs`) with template files in `src/templates/`. The shared CSS lives at `src/assets/shared.css`.

### Target State

```css
:root {
  --bg: #08101d;
  --bg-soft: #0d1729;
  --panel: rgba(255, 255, 255, 0.05);
  --panel-strong: rgba(255, 255, 255, 0.08);
  --panel-border: rgba(255, 255, 255, 0.11);
  --text: #f8fbff;
  --muted: rgba(228, 236, 247, 0.74);
  --soft: rgba(191, 206, 228, 0.74);
  --line: rgba(255, 255, 255, 0.08);
  --accent: #34d399;
  --accent-strong: #d1fae5;
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.28);
}
```

### Orb Colours
| Orb | Colour | CSS |
|-----|--------|-----|
| Primary | Emerald | `rgba(52, 211, 153, 0.22)` |
| Secondary | Blue | `rgba(59, 130, 246, 0.18)` |
| Tertiary | Gold | `rgba(255, 210, 122, 0.12)` |

### Background Gradient
```css
body {
  background:
    radial-gradient(circle at top left, rgba(52, 211, 153, 0.14), transparent 28%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.14), transparent 25%),
    linear-gradient(180deg, #07101d 0%, #09111f 45%, #0d1729 100%);
}
```

### Primary Button
```css
.button--primary {
  background: linear-gradient(135deg, #d1fae5, #34d399);
  color: #08101d;
}
```

### Eyebrow Colour
```css
.eyebrow { color: rgba(52, 211, 153, 0.76); }
```

### Status Chips (Repos-Specific)
Repo Foundry uses status chips for repo health indicators. These need updating to dark theme:
```css
.status-chip { background: rgba(255,255,255,0.06); color: rgba(228,236,247,0.74); }
.status-chip.is-green { background: rgba(52,211,153,0.16); color: #6ee7b7; }
.status-chip.is-yellow { background: rgba(251,191,36,0.16); color: #fcd34d; }
.status-chip.is-red { background: rgba(239,68,68,0.16); color: #fca5a5; }
```

### Pill/Tag System
```css
.pill { background: rgba(52,211,153,0.12); color: #6ee7b7; }
.pill--soft, .tag-chip { background: rgba(59,130,246,0.12); color: #93c5fd; }
```

## Codex Implementation Tasks

### Task 1: Rewrite shared.css from light to dark theme
- **File:** `W:\Repos\_My Open Source\repo-foundry\src\assets\shared.css`
- **Do:** This is a complete rewrite — the light paper theme becomes the dark atmospheric theme:
  1. Replace the entire `:root` block with the Target State variables above
  2. Change `html` background from cream (`#f7f2e7`) to dark (`linear-gradient(180deg, #07101d, #0d1729)`)
  3. Change `body` background gradient from orange/green radials on cream to emerald/blue radials on dark
  4. Replace all `var(--paper)` / `var(--panel)` references: the panel is now `rgba(255,255,255,0.05)` (dark glass) instead of `rgba(255,252,245,0.92)` (cream glass)
  5. Replace `var(--ink)` / `var(--ink-soft)` with `var(--text)` / `var(--muted)`
  6. Replace `var(--accent)` (#d8662d burnt orange) with `#34d399` (emerald)
  7. Replace `var(--accent-deep)` (#8f3512) with `#059669` (deep emerald)
  8. Update all card backgrounds: `rgba(255,255,255,0.78)` → `linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)), rgba(8,16,29,0.82)`
  9. Update all border colours: `rgba(21,32,24,0.12)` → `rgba(255,255,255,0.11)`
  10. Change `--body-font` from Segoe UI to `"Space Grotesk", sans-serif`
  11. Change `--display-font` from Palatino to `"Fraunces", Georgia, serif`
  12. Add atmosphere orb and grid classes from the Games Hub styles
  13. Update status chip colours to dark-theme variants
  14. Update metric card styles for dark backgrounds
  15. Update button colours (`.button-link`) to use emerald gradient
- **Verify:** Build and open repo-foundry. Should be a dark atmospheric site with emerald accents. Repo cards, metric grids, and navigation should all render correctly against the dark background.
- **Effort:** 90m (this is the biggest change)

### Task 2: Update HTML templates with shared structure
- **Files:** `W:\Repos\_My Open Source\repo-foundry\src\templates\public.mjs` and `internal.mjs`
- **Do:**
  1. Add Google Fonts import for Space Grotesk + Fraunces in the `<head>` section
  2. Add atmosphere HTML (`.atmosphere` div with orbs + grid) at the start of `<body>`
  3. Add `data-reveal` attributes on content sections
  4. Add scroll-reveal observer script
- **Verify:** Generated pages should show floating emerald/blue orbs and grid overlay.
- **Effort:** 30m

### Task 3: Rebuild dist from updated sources
- Run `npm run build:all` after Tasks 1 and 2 are complete
- **Verify:** `dist/` folder should contain updated public and internal HTML with the new dark theme.
- **Effort:** 5m

## Pages (from src/templates)
- Public version (index.html) — Repository showcase, safe for GitHub Pages
- Internal version — Adds session data, knowledge base, operations panels
- Detail pages — Individual repo deep dives

## Build System
- `scripts/compile-public-data.mjs` — Compiles safe public data
- `scripts/build-public.mjs` — Builds the GitHub Pages version
- `scripts/build-internal.mjs` — Builds the private local version
- `scripts/rebuild-all.mjs` — Runs all builds

# Repo Foundry — Handoff to Claude Code

You are picking up the visual design pass for **Repo Foundry**. The structural codebase already exists (`scripts/`, `src/templates/`, `src/lib/`, build pipeline). Your job is to land the v2 visual direction described in:

- `DESIGN-SPEC.md` — what we're building
- `TOKENS.md` — design tokens to ship verbatim
- `MOTION.md` — motion philosophy and timings
- `Repo Foundry Wireframes v2.html` (in the design project) — visual reference, 4 pages × 2 skins, 1 intro card

This document tells you how to land it in the codebase.

---

## 1. What is locked vs open

### Locked (do not invent your own)

- The two-skin model: HUD (default) + TERMINAL (toggle)
- The five accent colours and their hex values (`TOKENS.md` §2)
- Skin toggle + accent picker live top-right of every page
- Page hierarchies for Home / Feed / About / Contact (per `DESIGN-SPEC.md` §4 + wireframes)
- Motion philosophy and timing tokens
- Voice and copy direction
- No emoji, no light mode, no carousels, no infinite scroll
- All accent values come from CSS custom properties; zero hex in components

### Open (your call — flag the choice)

- Display font: `Boldonse` is recommended in `TOKENS.md`, but you can swap if you find better. Lock it before building, don't decide per-page.
- Specific scroll-driven anim implementations — CSS `animation-timeline: view()` is preferred; fall back to IntersectionObserver where browser support gates it.
- Whether to use View Transitions API or a JS routing crossfade — both are fine if the result matches `MOTION.md`.
- Exact ASCII banner artwork for TERMINAL pages (wireframe shows direction; refine for production)
- The repo dossier page layout (`/repos/:slug`) — not wireframed; build it on the Home + Feed primitives

### Do **not** revisit without checking in

- Light mode
- The accent list (5 colours, no more, no fewer)
- Skin model (no third skin)
- Page count for launch (the 4 covered)
- Decision to ship dark-only with one base background

---

## 2. File structure recommendation

Drop these into `repo-foundry/` alongside the existing pipeline:

```
repo-foundry/
  src/
    assets/
      css/
        tokens.css            ← copy verbatim from TOKENS.md
        skin-hud.css          ← HUD-specific overrides + widget styles
        skin-term.css         ← TERMINAL-specific overrides + window chrome
        motion.css            ← all keyframes + transition tokens from MOTION.md
        components.css        ← shared component styles (cards, buttons, forms)
      js/
        skin-toggle.js        ← reads/writes localStorage["foundry.skin"], sets <html data-skin>
        accent-picker.js      ← reads/writes localStorage["foundry.accent"], sets <html data-accent>
        keyboard.js           ← T / 1–5 / j/k shortcuts
        odometer.js           ← telemetry count-up
        ticker.js             ← scoreboard marquee (pure CSS preferred; JS for clone-and-loop)
    templates/
      layout.mjs              ← updated to include <SkinToggle> + <AccentPicker> in chrome
      partials/
        chrome.mjs            ← skin toggle + accent picker (used in all layouts)
        telemetry-bar.mjs
        agent-card.mjs
        scoreboard.mjs
        term-window.mjs
        ...
      pages/
        home.mjs
        feed.mjs
        about.mjs
        contact.mjs
```

`tokens.css` is the source of truth. Every other CSS file uses `var(--*)` references — no hex outside `tokens.css`.

---

## 3. Build order

1. **Tokens.** Copy `TOKENS.md` §1–8 into `src/assets/css/tokens.css`. Verify by setting `<html data-accent="blue" data-skin="hud">` on a stub page and confirming the accent flips everywhere.
2. **Chrome.** Build `SkinToggle` + `AccentPicker` components. Hook them up to `<html data-skin>` / `<html data-accent>` and `localStorage`. Test in isolation. Get this working end-to-end before any page work.
3. **Keyboard.** Wire <kbd>T</kbd>, <kbd>1</kbd>–<kbd>5</kbd>. Then <kbd>j/k</kbd> for nav lists. Then <kbd>?</kbd> for a help overlay listing all shortcuts.
4. **Motion.** Drop in `motion.css` and the `prefers-reduced-motion` overrides. Verify on a single test card that hover, focus, and the live dot all hit the documented timings.
5. **Home page, HUD skin.** Build out using the wireframe as reference. Get telemetry odometers, agent cards, detail panel, scoreboard all live.
6. **Home page, TERMINAL skin.** Reuse same data; build the window chrome and ASCII banner. Verify the toggle crossfade works.
7. **Feed page (both skins).** Add the news source and the highlight reel data wiring.
8. **About page (both skins).** Static content; should be quick.
9. **Contact page (both skins).** Build the form. Wire `transmit` to whatever backend (mailto fallback is fine for v1).
10. **Reduced motion test.** Set OS-level reduced motion; verify every animation pauses or instant-cuts. Verify the site is still usable and pleasant.
11. **Lighthouse pass.** Aim for Performance ≥ 90, Accessibility ≥ 95. Tab order should follow visual order.
12. **Acceptance criteria checklist** — `DESIGN-SPEC.md` §9. Every box ticked.

---

## 4. Skin toggle — implementation

```js
// skin-toggle.js
const SKINS = ['hud', 'term'];
const KEY = 'foundry.skin';

const stored = localStorage.getItem(KEY);
const initial = SKINS.includes(stored) ? stored : 'hud';
document.documentElement.dataset.skin = initial;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-skin-set]');
  if (!btn) return;
  const skin = btn.dataset.skinSet;
  if (!SKINS.includes(skin)) return;
  document.documentElement.dataset.skin = skin;
  localStorage.setItem(KEY, skin);
});

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 't' || isTyping(e.target)) return;
  const next = document.documentElement.dataset.skin === 'hud' ? 'term' : 'hud';
  document.documentElement.dataset.skin = next;
  localStorage.setItem(KEY, next);
});
```

CSS does the rest — `:root[data-skin="term"]` rules in `skin-term.css` override what's in `skin-hud.css`. **No JS conditional rendering for the skin.** Same HTML, different styles.

---

## 5. Accent picker — implementation

```js
// accent-picker.js
const ACCENTS = ['magenta', 'blue', 'green', 'amber', 'violet'];
const KEY = 'foundry.accent';

const stored = localStorage.getItem(KEY);
const initial = ACCENTS.includes(stored) ? stored : 'magenta';
document.documentElement.dataset.accent = initial;

document.addEventListener('click', (e) => {
  const dot = e.target.closest('[data-accent-set]');
  if (!dot) return;
  const a = dot.dataset.accentSet;
  if (!ACCENTS.includes(a)) return;
  document.documentElement.dataset.accent = a;
  localStorage.setItem(KEY, a);
});

document.addEventListener('keydown', (e) => {
  if (isTyping(e.target)) return;
  const i = '12345'.indexOf(e.key);
  if (i < 0) return;
  const a = ACCENTS[i];
  document.documentElement.dataset.accent = a;
  localStorage.setItem(KEY, a);
});
```

Use `transition: background-color 180ms var(--ease-out), border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out);` on accent consumers so the swap is smooth. **Don't transition `--accent` itself** — CSS custom properties don't tween reliably; transition the consuming properties.

---

## 6. Page transitions — implementation

Use the View Transitions API where supported:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 280ms;
  animation-timing-function: var(--ease-out);
}

/* Agent card → dossier hero */
.agent-card[data-view-transition] { view-transition-name: agent-card; }
.dossier-hero { view-transition-name: agent-card; }
```

Fallback: a JS crossfade matching the same 280ms. Keep both code paths short.

---

## 7. What to copy verbatim from the wireframes

These are good enough to lift directly:

- `.livedot` keyframes (`MOTION.md` §3)
- `.ticker-track` marquee implementation
- `.brk` (bracket corner) layout primitive — 4 absolutely-positioned divs at corners
- All copy: headlines, eyebrows, button labels, status pills
- Page layout proportions (column ratios, gutter sizes)
- TERMINAL window chrome structure (traffic lights → tab strip → prompt → body → status bar)

## 8. What to NOT copy from the wireframes

- `Patrick Hand` font — wireframe-only. Swap to production display font.
- `.scrib` diagonal hatching — replace with real imagery (screenshots, abstract SVG posters)
- `<MotionNote>` annotation markers — wireframe-only
- The dashed `.box` borders — replace with solid `var(--line)` borders
- Placeholder `[screenshot]` / `[poster]` labels — replace with real assets
- The exact wireframe colour `#0e0c10` if you want to nudge it ±2 lightness — fine, just update `--paper` in tokens

---

## 9. Existing repo files this work supersedes

| File in repo | Status after this pass |
|---|---|
| `DESIGN.md` | superseded by `DESIGN-SPEC.md`. Keep as historical, mark with "superseded by handoff/DESIGN-SPEC.md (v2)" at top, or replace. |
| `CLAUDE-DESIGN-HANDOFF.md` | superseded by THIS file. Same — keep historical or replace. |
| `SCOPE.md` | still valid. Don't touch. Strategic context unchanged. |
| Emerald palette in `src/assets/shared.css` | replace with `tokens.css`. Magenta is now the default accent, not emerald. |

---

## 10. Phased rollout

### v2.0 — launch
- 4 pages (Home / Feed / About / Contact), both skins, all 5 accents
- Skin toggle, accent picker, keyboard shortcuts
- Acceptance criteria from `DESIGN-SPEC.md` §9 met

### v2.1 — repo dossier
- `/repos/:slug` page in both skins
- View transitions from agent card / table row → dossier
- Dossier-specific motion (release timeline, contributor flow micro-viz)

### v2.2 — lanes + library
- `/lanes` index + `/lanes/:laneId` single
- `/repos` full catalogue with filter / sort

### v2.3 — visualisations + Codex shelf
- `/visualisations` data art
- `/resources/codex` Codex-adjacent reading list

### Future
- Public API (`/feed.json`, per-lane JSON)
- Cross-link policy with StackScout / AI Resource Hub / GameTrackDaily
- Custom domain + SEO polish

---

## 11. Questions to flag back before you start

If any of these aren't pre-answered when you sit down to build, **stop and ask**. They affect tokens / structure and are easier to decide once than to undo:

1. Display font — confirm `Boldonse` or propose alternative
2. Default skin for new visitors — confirm HUD
3. Default accent for new visitors — confirm `magenta`
4. View Transitions API or JS crossfade — your call, but commit to one
5. Whether the accent persists across separate visits (yes — `localStorage`) or session-only — confirm `localStorage`
6. Form backend for Contact — `mailto:` fallback for v1, or wire a real endpoint?
7. Whether the public RSS feed should re-tint per-visitor accent — recommend no (RSS clients can't render it; ship a neutral SVG icon)

---

## 12. Don't

- Don't add a third skin.
- Don't add a sixth accent.
- Don't introduce a light mode.
- Don't put emoji anywhere — including 404 pages, error states, and toasts.
- Don't replace any operator-language copy with generic SaaS phrasing.
- Don't add motion that violates `MOTION.md` §1.
- Don't ship a hex value outside `tokens.css`. Run a grep before merging.

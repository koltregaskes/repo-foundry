# Repo Foundry — Design Tokens

CSS custom properties. The whole product runs off these. No component should declare a colour, font, radius, or shadow that isn't here.

**Companion:** `DESIGN-SPEC.md` (the WHAT), `MOTION.md` (the WHEN), `HANDOFF.md` (the BUILD).

---

## 1. Colour — base (skin-agnostic)

```css
:root {
  /* Foundation — dark base, never changes regardless of accent */
  --paper:        #0e0c10;   /* primary background */
  --paper-2:      #14111a;   /* elevated surface (cards, panels) */
  --paper-3:      #1a1620;   /* deepest layer (hover states on dark cards) */

  /* Ink — text / borders */
  --ink:          #f3eee6;   /* primary text — warm bone */
  --ink-2:        rgba(243, 238, 230, 0.7);   /* secondary text */
  --ink-3:        rgba(243, 238, 230, 0.5);   /* muted, eyebrow text */
  --ink-4:        rgba(243, 238, 230, 0.25);  /* faint dividers */
  --line:         rgba(243, 238, 230, 0.4);   /* default border */
  --line-strong:  rgba(243, 238, 230, 0.55);  /* emphasised border */

  /* Status (skin-agnostic, accent-agnostic) */
  --status-live:    #28d172;
  --status-build:   #ffae3c;
  --status-soon:    rgba(243, 238, 230, 0.5);
  --status-down:    rgba(243, 238, 230, 0.25);
}
```

## 2. Colour — accent (5 themes)

Each accent ships a *family* of four values. The 5 accents share the same names — only the hex shifts.

```css
:root[data-accent="magenta"] {
  --accent:        #ff2d6e;
  --accent-2:      #ff5e8c;   /* hover / pressed */
  --accent-soft:   rgba(255, 45, 110, 0.12);   /* tinted fill */
  --accent-glow:   rgba(255, 45, 110, 0.35);   /* shadow / outer glow */
  --accent-ink:    #0e0c10;   /* text on solid accent buttons */
}

:root[data-accent="blue"] {
  --accent:        #3d8bff;
  --accent-2:      #6aa6ff;
  --accent-soft:   rgba(61, 139, 255, 0.12);
  --accent-glow:   rgba(61, 139, 255, 0.35);
  --accent-ink:    #0e0c10;
}

:root[data-accent="green"] {
  --accent:        #28d172;
  --accent-2:      #56dd91;
  --accent-soft:   rgba(40, 209, 114, 0.12);
  --accent-glow:   rgba(40, 209, 114, 0.35);
  --accent-ink:    #0e0c10;
}

:root[data-accent="amber"] {
  --accent:        #ffae3c;
  --accent-2:      #ffc36a;
  --accent-soft:   rgba(255, 174, 60, 0.14);
  --accent-glow:   rgba(255, 174, 60, 0.40);
  --accent-ink:    #0e0c10;
}

:root[data-accent="violet"] {
  --accent:        #9b7cff;
  --accent-2:      #b59cff;
  --accent-soft:   rgba(155, 124, 255, 0.14);
  --accent-glow:   rgba(155, 124, 255, 0.40);
  --accent-ink:    #0e0c10;
}
```

### Usage rules

- Every accent-coloured surface in the UI uses `var(--accent)` or `var(--accent-*)`. **Zero hex references outside this file.**
- Toggle by setting `<html data-accent="blue">`. The `AccentPicker` writes both this attribute and `localStorage["foundry.accent"]`.
- Default: `<html data-accent="magenta">`.

## 3. Skin overrides

A single attribute on `<html>` switches structural feel. Most colours stay, but a few panel/border treatments shift.

```css
:root[data-skin="hud"] {
  --panel-bg:        rgba(243, 238, 230, 0.04);
  --panel-border:    var(--line);
  --panel-radius:    6px;
  --font-display:    var(--font-display-hud);
  --font-body:       var(--font-body-hud);
}

:root[data-skin="term"] {
  --panel-bg:        transparent;
  --panel-border:    var(--line-strong);
  --panel-radius:    4px;
  --font-display:    var(--font-mono);   /* term is mono everywhere */
  --font-body:       var(--font-mono);
  /* CRT scanline overlay applied via ::before on .term-window */
}
```

Default: `<html data-skin="hud">`.

## 4. Type

```css
:root {
  /* Families */
  --font-display-hud:  'Boldonse', 'Big Shoulders Display', 'Anton', system-ui, sans-serif;
  --font-body-hud:     'Inter', system-ui, sans-serif;
  --font-mono:         'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;

  /* Scale (rem-based; 1rem = 16px) */
  --fs-xs:   0.625rem;   /* 10px — eyebrows, tinytext */
  --fs-sm:   0.75rem;    /* 12px — body small, table cells */
  --fs-base: 0.875rem;   /* 14px — body */
  --fs-md:   1rem;       /* 16px — body large */
  --fs-lg:   1.375rem;   /* 22px — h3 / featured stat */
  --fs-xl:   2rem;       /* 32px — h2 */
  --fs-2xl:  3rem;       /* 48px — h1 default */
  --fs-3xl:  4rem;       /* 64px — hero h1 */

  /* Line height */
  --lh-tight: 0.95;
  --lh-snug:  1.2;
  --lh-body:  1.4;
  --lh-loose: 1.6;

  /* Tracking */
  --tr-tight: -0.01em;
  --tr-mono:  0.02em;
  --tr-label: 0.14em;
  --tr-wide:  0.18em;
}
```

### Display font

The wireframes use `Patrick Hand` for sketch fidelity. **Production swap:** pick one of:

1. **Boldonse** (recommended) — high-contrast, slightly editorial, dark-mode-friendly
2. **Big Shoulders Display** — condensed sport energy, esports-coded
3. **Anton** — flatter, more brutalist, last resort

Pick one and lock it. The display font appears only in h1/h2 — never below ~24px.

### Mono

`JetBrains Mono` is the locked choice. Used pervasively in TERMINAL skin and for all labels/stats in HUD.

### Body

`Inter` for HUD skin body copy and form labels.

## 5. Spacing

```css
:root {
  --space-1:  4px;
  --space-2:  6px;
  --space-3:  8px;
  --space-4:  12px;
  --space-5:  14px;
  --space-6:  18px;
  --space-7:  24px;
  --space-8:  32px;
  --space-9:  44px;

  --gutter:   var(--space-7);   /* page horizontal padding */
  --rhythm:   var(--space-6);   /* vertical between sections */
}
```

## 6. Radius

```css
:root {
  --r-xs:  2px;    /* pills inside other widgets */
  --r-sm:  4px;    /* tags, status chips */
  --r-md:  6px;    /* cards, panels (HUD default) */
  --r-lg:  14px;   /* chrome buttons, segmented controls */
  --r-pill: 999px;
}
```

## 7. Shadow

```css
:root {
  --shadow-sm:    0 4px 14px rgba(0, 0, 0, 0.35);
  --shadow-md:    0 12px 36px rgba(0, 0, 0, 0.45);
  --shadow-glow:  0 0 16px var(--accent-glow);    /* used on hover, focused cards, hot cards */
  --shadow-ring:  0 0 0 2px var(--accent), var(--shadow-glow);
}
```

## 8. Z-index

```css
:root {
  --z-base:    0;
  --z-overlay: 10;   /* scanlines, ambient bg */
  --z-sticky:  20;   /* top nav */
  --z-popover: 40;
  --z-modal:   60;
  --z-toast:   80;
}
```

# Repo Foundry — Motion

Motion philosophy for the hi-fi build. The brief is one line: **interesting, dynamic, smooth — without being OTT or aggressive.**

---

## 1. Philosophy

- **Motion has a reason.** Every animation either (a) explains a state change, (b) directs attention, or (c) sets atmosphere. Never decorate for its own sake.
- **Easing is gentle.** Default to `cubic-bezier(0.2, 0.7, 0.3, 1)` — confident in, soft out. No bouncy spring on UI; no overshoot.
- **Durations are short.** Most things resolve in 180–400ms. Background atmosphere drifts on 15–40s loops, never faster.
- **Respect `prefers-reduced-motion`.** Cut everything to instant or fade. The site must remain usable and pleasant at OS-level reduced motion.

### Banned

- ❌ Bounce / overshoot springs on UI
- ❌ Confetti
- ❌ Auto-playing video / GIF backgrounds
- ❌ Parallax that isn't direction-conveying
- ❌ Hover wobbles
- ❌ "AI-coded" purple-on-white gradient sweeps
- ❌ Motion that loops faster than once per 2s in the user's foveal vision

---

## 2. Timing tokens

```css
:root {
  --t-instant: 80ms;
  --t-quick:   180ms;     /* hover, focus, small reveals */
  --t-medium:  320ms;     /* page sections, panel reveals */
  --t-slow:    600ms;     /* hero entrance, scan-line drops */
  --t-ambient: 15s;       /* background gradient drift */
  --t-ticker:  38s;       /* scoreboard marquee */

  --ease-out:  cubic-bezier(0.2, 0.7, 0.3, 1);
  --ease-in:   cubic-bezier(0.4, 0, 0.6, 0);
  --ease-both: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-flat: linear;     /* tickers, scanlines only */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --t-instant: 0ms;
    --t-quick:   0ms;
    --t-medium:  0ms;
    --t-slow:    0ms;
  }
  /* Tickers, marquees, and ambient drift all set to paused via @keyframe stops. */
}
```

---

## 3. Effect catalogue

### Hover (cards, agents, buttons)
- Transform: `translateY(-2px)` + `scale(1.015)`
- Border: → `var(--accent)`
- Shadow: + `var(--shadow-glow)`
- Duration: `var(--t-quick)`, ease `--ease-out`

### Focus-visible (inputs, links, segmented controls)
- Outline: `2px solid var(--accent)`, offset `3px`
- No transform — keep it stable for keyboard users

### Selection (agent card "lock in", filter chip active)
- Background → `var(--accent)`, text → `var(--accent-ink)`
- Bracket corners draw in: 4 corners animate in sequence over 220ms total
- Duration: `var(--t-medium)`

### Skin toggle (HUD ↔ TERMINAL)
- Crossfade the page body — old skin fades to 0 over 160ms, new fades in over 240ms with a 40ms overlap
- Top-right chrome pill animates the slider thumb in 180ms ease-out
- Persist immediately on click

### Accent picker (1 → another)
- Re-tint is instant — `--accent` flips, every consumer responds via CSS transitions on the relevant properties (180ms)
- Picker dot: selected dot scales 1.05 with 160ms ease

### Page transitions (route change)
- Use `view-transition-name` on major elements:
  - HUD: featured card → dossier hero
  - HUD: agent in grid → dossier portrait
  - TERMINAL: row in list → dossier prompt block
- Default crossfade: 280ms

### Live dot (telemetry status, breaking news flag)
- Opacity 1 → 0.55 → 1, scale 1 → 0.85 → 1, over 1.6s, ease-in-out, infinite
- Already implemented as `.livedot` in wireframes — copy verbatim

### Telemetry stats (numbers in the top strip)
- On scroll into view: rolling odometer count-up over 600ms, ease-out
- On data refresh: fade-pulse the changed cell over 240ms
- Only count-up integers > 0; floats render straight (don't roll decimals)

### Scoreboard ticker
- `transform: translateX(0 → -50%)` over `--t-ticker` (38s), linear, infinite
- Pause on hover (set `animation-play-state: paused`)
- Pause on `prefers-reduced-motion`

### Story drops (Feed page)
- New stories slide in from top with 24px translate-Y → 0, fade 0 → 1, 320ms ease-out
- Stagger consecutive arrivals by 60ms
- "Breaking" badge gets a single 600ms accent pulse on first appearance, never again

### Form focus (Contact page)
- Field gets `--accent-soft` background, accent border, accent caret
- Bracket corners draw in over 220ms
- Caret blinks at 1.0s steps (no smoother — feels less authentic)

### Submit / transmit
- Button gets `--shadow-ring`
- A 1px scan-line element drops top → bottom over 600ms with `--ease-out`
- Then content fades to "received" state over 240ms
- **No confetti. No checkmark explosion.** A line that says `✓ TRANSMITTED · #2049` is enough.

### Terminal: command stream / `tail -f`
- New rows type at 24 characters per second (use `@keyframes` width-clip or JS character-by-character)
- Cursor sits at end, blinks every 1.0s
- Pause on hover; resume on mouseleave

### Ambient (page background)
- Two soft radial gradients (`--accent-soft` + `--accent-glow`) drifting on a 15s ease-in-out loop, ~6% movement
- Subtle; only at the edges of the viewport
- Optional. Easy to disable per page.

### TERMINAL CRT scanline
- Static repeating gradient overlay at low alpha
- **No** flicker, **no** rolling line — just a static texture

---

## 4. Per-page motion sheet

| Page | Skin | Motion notes |
|---|---|---|
| Home | HUD | Telemetry odometers · agent hover tilt · select bracket-draw · ticker · scoreboard pulse on stat-leader change |
| Home | TERM | ASCII banner fade-in 400ms · row hover wash · cursor blink · ticker (same) |
| Feed | HUD | Story slide-in stagger · breaking pulse · highlight card hover parallax (12px Y on scrib only) |
| Feed | TERM | `tail -f` typewriter · breaking row pulse · highlight block hover · sources checkbox snap |
| About | HUD | Operator card breathing (8s loop) · timeline scroll-draw · ROE check ticks staggered 80ms |
| About | TERM | `whoami` reveal · lane `ls` reveal · milestone live-dot pulse · keep cursor stable |
| Contact | HUD | Field focus bracket-draw · transmit scan-line · transmission log new-line stream |
| Contact | TERM | Field caret blink · transmit scan-line (same as HUD) · inbound log stream |

---

## 5. What "interesting but not OTT" means in practice

- One thing at a time. The eye should always have ONE focal animation, never four competing.
- Atmosphere is allowed — ambient drift, scanlines, ticker. These are background and never demand attention.
- Reveal animation should never block reading. Text appears before motion completes.
- If you cut all CSS animations the site should still feel deliberate. (Test: `* { animation: none !important; transition: none !important; }` in DevTools. If the site feels dead, the layout is doing too little work.)

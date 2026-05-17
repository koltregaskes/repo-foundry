# Repo Foundry — Design Spec v2

**Status:** locked · ready for hi-fi implementation
**Supersedes:** `DESIGN.md` (v1, emerald direction) and the visual direction in `CLAUDE-DESIGN-HANDOFF.md`
**Scope:** product identity, two skins, accent palette, page inventory, voice
**Companions:** `TOKENS.md`, `MOTION.md`, `HANDOFF.md`
**Wireframes:** `Repo Foundry Wireframes v2.html` (canvas of 8 frames + intro)

---

## 1. Product identity

**Repo Foundry** is a curated, editorial site for high-signal open-source repositories. Operator-minded readers, agent‑coder beat, daily automated + lightly editorial cadence.

It is not a SaaS dashboard. It is not a generic awesome-list. It looks like an **esports loadout screen** with an optional **operator-grade terminal** under the same hood.

| Axis | Value |
|---|---|
| Tone | Editorial · technical · operator-minded · slightly playful |
| Surface | Public discovery site (GitHub Pages target) |
| Author | One operator (Kol). Curation is the value, not volume. |
| Posture | "Company in formation" — confident, but honest about what isn't built yet |

---

## 2. Two skins, one product

The product ships with **two skins** the visitor can toggle between, persisted to `localStorage`.

### A · HUD (default)
- **Reference:** Valorant agent select / Apex legend pick / Destiny 2 character screen / esports broadcast HUD
- **Mood:** kinetic, confident, smooth — *interesting and dynamic without being OTT*
- **Surface:** dark base, accent glow, big editorial titles, bracket-corner panels, live telemetry strips
- **Use it for:** the default visitor experience — magazine + dashboard hybrid

### B · TERMINAL
- **Reference:** modern terminal apps (Warp, Wezterm) crossed with a friendly BBS
- **Mood:** dense, fast, keyboard-first, slightly nostalgic
- **Surface:** windowed chrome (traffic lights), tabbed pages, ASCII headers, monospace everything, subtle CRT scanlines
- **Use it for:** operator visitors who want signal density. Same data, same accent, different presentation.

### Rule
**Both skins share the dark base, the accent colour, the type system, and the page content.** Only layout/widget vocabulary changes. The toggle is a re-skin, not a re-architecture.

### Toggle UX
- Lives **top-right** of every page (sticky)
- Pill segmented control: `HUD | TERMINAL`
- Keyboard shortcut: <kbd>T</kbd>
- Persists to `localStorage["foundry.skin"]`
- Default for new visitors: `HUD`

---

## 3. Accent palette

The site ships **five accent colours** the visitor can pick from. The chosen accent drives every magenta-shaped highlight in the wireframes — buttons, live dots, bracket corners, link hovers, focused inputs, ticker active rows.

| Key | Name | Hex | Tone |
|---|---|---|---|
| `magenta` | Hot Magenta | `#ff2d6e` | bold, default, the brand-aligned pick |
| `blue` | Electric Blue | `#3d8bff` | calm, classic, web-default-friendly |
| `green` | Phosphor Green | `#28d172` | fresh, terminal-y, low-stakes |
| `amber` | Amber | `#ffae3c` | warm, premium, editorial |
| `violet` | Iris Violet | `#9b7cff` | playful, PS5-coded |

### Picker UX
- Lives **immediately right of the skin toggle**, top-right of every page
- Five small swatches in a rounded pill — current accent has a bone-coloured outline + soft glow
- Keyboard shortcut: <kbd>1</kbd>–<kbd>5</kbd>
- Persists to `localStorage["foundry.accent"]`
- Default for new visitors: `magenta`

### Rules
- Only ONE accent on screen at a time. No multi-accent UI.
- All accent uses ship as `var(--accent)` and `var(--accent-soft)` (8% alpha tint). No hard-coded hex in components.
- Background and text colours never change with accent. Only accent-keyed elements re-tint.
- The chosen accent applies to BOTH skins.

See `TOKENS.md` for the full `--accent-*` token set.

---

## 4. Page inventory

The wireframes cover **four launch pages** in both skins. The full route map below shows where they sit in the longer-term IA.

### Launch pages (wireframed, both skins)

| Page | Route | HUD vocabulary | TERMINAL vocabulary |
|---|---|---|---|
| **Home** | `/` | "Select your weapon" + agent-select grid + telemetry + scoreboard | `foundry list --lane=agents` + ASCII banner + table + right-side info pane |
| **Feed** | `/news` | "Foundry Feed" telemetry + story drops + 3 highlight reels + sources panel | `tail -f /feed` + scrolling stories + highlight blocks + sources checklist |
| **About** | `/about` | "The Operator" + profile card + mission + lanes patrolled + ROE + timeline | `whoami` + `cat ./mission` + `ls ./lanes` + `cat /rules-of-engagement` + `git log --milestones` |
| **Contact** | `/contact` | "Incoming" + comms form + channels + ops status + transmission log | `comms.transmit --interactive` + form prompts + channels list + ops graph + inbound log |

### Existing routes (from old `DESIGN.md`) — still in scope

```
/                     home (covered)
/trending             trending repos (use Feed pattern, filter)
/repos                full library / catalogue
/repos/:slug          repo dossier page
/lanes                lane index
/lanes/:laneId        lane page (use Home pattern, single lane)
/news                 feed (covered)
/visualisations       data art shelf
/resources/codex      Codex-adjacent shelf
/about                about (covered)
/contact              contact (new; covered)
```

### Pages NOT yet designed (next milestone)

- `/repos/:slug` — single dossier page (highest priority after launch)
- `/lanes/:laneId` — single lane page (next)
- `/repos` — full catalogue / library view
- `/visualisations` — data art layouts
- `/resources/codex` — Codex shelf

All five should follow the Home + Feed primitives — agent-select grid + telemetry + scoreboard — restyled for purpose. Do not invent new layout vocabularies.

---

## 5. Component manifest

Components that exist across both skins and pages. Build these as shared React/whatever-stack components, themed by skin.

### Chrome
- `<SkinToggle>` — pill segmented control, top-right
- `<AccentPicker>` — 5 swatches, top-right next to toggle
- `<TopNav>` — wordmark + page tabs + live time stamp (HUD only — TERMINAL uses window tabs)
- `<Footer>` — minimal: copyright, GitHub link, RSS, last build timestamp

### HUD widgets
- `<TelemetryBar>` — top strip of 4–5 live stats with accent glow
- `<Stat label val delta glow?>` — one cell of a telemetry bar
- `<AgentCard>` — repo as character card, hover tilt, hot/sel states, bracket corners on selected
- `<DetailPanel>` — right-rail panel with bracket corners, HP/DMG/SPD/DEF bars, match history
- `<HighlightCard>` — rank + name + blurb + stars/velocity
- `<StoryCard>` — timestamp + source + title + blurb, with `breaking` variant
- `<ChannelCard>` — comms channel with icon + addr + open/slow/down status
- `<Scoreboard>` — bottom ticker, marquee 38s, pauses on hover

### TERMINAL widgets
- `<TermWindow active cmd children>` — full window chrome: traffic lights, tab strip (`~/home`, `~/feed`, `~/about`, `~/contact`), prompt line, status bar
- `<TermRow>` — table row with idx · name · lane · stars · delta · age columns
- `<TermBlock>` — `<pre>` block for ASCII output (file listings, ROE checks, milestones)
- `<TermInput focused>` — form field rendered as `? prompt` with magenta caret

### Shared atoms
- `<Eyebrow>` — small all-caps mono label
- `<MotionNote>` — wireframe-only annotation marker (delete from production)
- Live dot — pulsing accent indicator (`<LiveDot>` or `.livedot` utility)
- Bracket corners — `<Brk position="tl|tr|bl|br">` for HUD framing

### Atoms used in wireframes that should NOT ship to production
- `.scrib` (diagonal hatching) → replace with real screenshots or abstract SVG posters
- `.box` (dashed border) → real cards
- `Patrick Hand` font → production uses real display font (see `TOKENS.md`)
- `<MotionNote>` annotations → production has no inline annotations

---

## 6. Voice & copy

Carried over from the established Repo Foundry tone; tightened.

- **Person:** third person or impersonal. Rarely "I".
- **Tense:** present, declarative.
- **Cadence:** short sentences. Full stops at the end of headlines. Oxford comma.
- **Title case:** product names only (Repo Foundry, AI Agents). Everything else is sentence case or UPPER+mono+wide tracking for labels.
- **Operator language:** "loadout", "lanes patrolled", "rules of engagement", "open comms", "transmission". Gaming-coded but never cringe. Use sparingly — once per page, not as decoration.
- **No emoji.** None. Anywhere.
- **No corporate claims.** No "industry-leading", "enterprise", "trusted by". Honest about company-in-formation status.

### Status pills
- `LIVE` — bone on muted green tint
- `IN BUILD` — bone on accent-soft tint
- `COMING SOON` — muted on white-at-5%

### Headline rhythm — examples to match

| Slot | Wording |
|---|---|
| Eyebrow | `BROADCAST · ON-AIR` · `// LOADOUT` · `// DOSSIER` |
| H1 | *Select your weapon.* · *Foundry Feed.* · *The Operator.* · *Incoming.* |
| CTA | `LOCK IN AGENT →` · `▸ TRANSMIT` · `▸ SUBSCRIBE → RSS` |

---

## 7. Imagery

- **Repo screenshots** for the catalogue / lane / dossier pages (real desktop captures, 16:9 or 16:10)
- **Abstract SVG posters** for tools/games/CLIs where a real screenshot would feel weak
- **No emoji. No stock photography. No AI-generated illustration. No mascots.**
- The decorative `.scrib` hatching in the wireframes is a placeholder — it never ships. Replace with real imagery or leave the surface clean.

---

## 8. What's deliberately NOT in this design

- No light mode. The product is dark-only by spec.
- No swappable type system. Type is locked (see `TOKENS.md`).
- No alternate dark backgrounds. The base `#0e0c10` is fixed; only the accent re-tints.
- No icon font. Inline glyphs only where the existing wireframes use them (▸ ▸ ★ → ●). If a real icon is unavoidable, use Lucide at 1.5px stroke and flag it.
- No homepage carousel. Shelves and ticker only.
- No infinite scroll. Paginate or "see lane" → dedicated page.

---

## 9. Acceptance criteria

A hi-fi build of this spec is done when:

- [ ] All 4 launch pages render in both skins
- [ ] Skin toggle works, persists, animates between states (180–400ms)
- [ ] Accent picker works, persists, retints every accent-keyed element instantly
- [ ] All copy from the wireframes is in place verbatim (or improved, with reason)
- [ ] No motion violates `MOTION.md` (no bounce, no confetti, no parallax-without-purpose)
- [ ] No accent value is hard-coded outside `TOKENS.md`
- [ ] Keyboard shortcuts (<kbd>T</kbd>, <kbd>1</kbd>–<kbd>5</kbd>, <kbd>j/k</kbd> for nav lists) work
- [ ] `prefers-reduced-motion` cuts all non-essential motion to instant
- [ ] Lighthouse: Performance ≥ 90 (no heavy JS bundles); Accessibility ≥ 95

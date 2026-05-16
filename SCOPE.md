# Repo Foundry — Strategic Scope Brief

**Status:** v1 DRAFT, awaiting Kol's review and amendment
**Last updated:** 2026-05-16
**Author:** Claude (website manager)
**Purpose:** Capture the strategic context for `repo-foundry` so future design + content briefs start from a shared understanding.

This is **not** a design brief and not an implementation plan. The repo already has a solid `DESIGN.md` (Repo Foundry's identity, emerald palette, magazine-style direction) and a `CLAUDE-DESIGN-HANDOFF.md`. This brief covers product context, audience, and content sources.

---

## Product identity

**Repo:** `repo-foundry` (on disk at `W:\Websites\sites\repo-foundry`)
**Public brand:** Repo Foundry
**Domain:** TBD
**Stack:** Build pipeline (`scripts/` + `src/templates/` + `src/lib/` + `package.json`) — produces both internal and public outputs from a shared codebase. Per repo README: `dist/public/` is the GitHub Pages output.
**Deploy:** GitHub Pages from `dist/public/`
**Internal counterpart:** `W:\Repos\_local\surfaces\repo-foundry-internal` (operational console — out of scope here)

**One-sentence pitch:** Repo Foundry is a curated foundry floor for high-signal open-source repositories — trend watching, category mapping, and Codex-adjacent tooling references — written for operator-minded readers.

The design identity is already locked in Repo Foundry's existing `DESIGN.md`:

- **Tone:** Editorial, technical, operator-minded
- **Aesthetic:** Dark glass panels on deep blue-black field; emerald primary accent, blue and amber support
- **Type:** Serif display + technical grotesk
- **Position:** Foundry floor, not dashboard

The current direction notes that the structure is in place — homepage, signals, library, news, visualisations, Codex resources, about, repo dossier pages, lane/category pages. The "final beauty pass" is the next step.

---

## What lives here

Per the existing repo structure:

- **Public pages** — `signals`, `library`, `news`, `visualisations`, `Codex resources`, `about`
- **Repo dossier pages** — one per curated repo (deep-link target with metadata, last release, contributor signals)
- **Lane / category pages** — main public shelves grouping repos by topic
- **Magazine-style homepage** — already in place

Build pipeline architecture:

- `content/public/manual/` — public editorial seed content
- `scripts/` — compilers and build scripts
- `src/assets/` — shared CSS and browser code
- `src/internal-runtime/` — internal hub server (private)
- `src/lib/` — build helpers and data contracts
- `src/templates/` — HTML page builders
- `dist/public/` — generated public site (GitHub Pages target)

---

## Why this site exists

Three converging needs:

1. **Trend watching beyond GitHub Trending.** GitHub's own trending page is noisy and recency-biased. Repo Foundry curates: which repos matter beyond the spike, why, and where they fit in a wider category map.

2. **Operator-minded curation.** Most repo-discovery sites (Awesome lists, libhunt, dependency analyzers) target consumers/integrators. Repo Foundry targets people **building agent systems and developer tooling** — the kind who care about Codex-adjacent infrastructure, MCP servers, agent runtimes, evaluation harnesses.

3. **Visualisation surface.** The visualisations page is a differentiator most repo-tracking sites lack — graphs of language/topic trends, contributor flow, release cadence. This is the "data journalism for code" angle.

---

## Differentiator

| Site type | What they do | What Repo Foundry does differently |
|---|---|---|
| GitHub Trending | Algorithmic trending | Curated + categorised + editorial commentary |
| Awesome lists | Long alphabetical reference | Magazine layout + dossier pages + visualisations |
| libhunt / Best of JS | Library comparison by language | Cross-language by **operator concern** (agent infra, build, CLI, etc.) |
| Hacker News / Lobsters | News + comments | Slower-cadence, deeper takes; less news, more signal |

Combination of **curated dossier pages + visualisation layer + operator framing + Codex-adjacent angle** is the gap.

---

## Content sources Claude Design needs to know about

### Curated repos

The "library" rail is the catalogue. Each entry presumably has fields like:
- Name, primary language, topics
- Curator's note (Kol's take)
- Last reviewed date
- Trend signals (stars over time, releases, contributors)
- Category / lane assignment
- Tags

**Action item for Codex (separate from this brief):** confirm the manifest location and field set. Repo Foundry's data contracts (per the `src/lib/` reference) likely define this.

### Signals page

Trend detection over GitHub data. Sources likely include:
- GitHub Search API (stars in last N days, language filters)
- GitHub Releases for tracked repos
- Manual flags by Kol when a repo earns coverage

### News rail

Open-source news — license disputes, governance changes, big mergers, project pivots, major releases. Where do these come from? Lobsters, HN front page filtered to OSS, X follows? **TBD with Kol.**

### Visualisations

Likely candidates:
- Language popularity over time (across tracked repos)
- Contributor flow (who moves between projects)
- Release cadence per repo / category
- Topic clusters (semantic groupings of tracked repos)

Each visualisation is a content unit. Worth listing as `Dataset` schema for AI agents to discover.

### Codex resources page

Codex-adjacent material — agent SDKs, eval harnesses, MCP implementations, prompt libraries. This is the editorial bridge to the rest of Kol's estate (ai-resource-hub for models, StackScout for tools).

---

## Audience

1. **Operators / agent builders** — the primary persona. Wants to know "what infrastructure should I be tracking?"
2. **OSS maintainers** — wants to see how their project's signal stacks against peers, may discover under-watched neighbours
3. **AI agents** — strong fit for structured data (Dataset, SoftwareSourceCode, Person schemas). Codex-adjacent angle means LLM-based dev tools will likely query this site for "best repo for X" answers.

Persona 3 again. Repo Foundry is naturally agent-friendly because its content IS structured (repos have schema-mappable metadata). High ROI for JSON-LD work.

---

## Editorial cadence

Open questions for Kol:

- Signals page — refreshed daily? Hourly? Manual editorial gates?
- News rail — daily roundup or curated weekly?
- Repo dossiers — added on a schedule (one new dossier per week)?
- Visualisations — refreshed at what cadence?
- Who reviews / writes dossier notes — Kol, an AI agent, hybrid?

### Codex-adjacent positioning — open question

The site's framing is "Codex-adjacent tooling references." Worth confirming with Kol whether this is a permanent identity or a launch-positioning move:

- Permanent: the site builds a deep niche around agent-coder infrastructure. Smaller audience, deeper trust.
- Launch positioning: leverage current Codex interest to bootstrap, then broaden.

Affects categories / lanes covered. A permanent positioning is narrower; a launch positioning is wider.

---

## Relationship to other estate sites

- **`elusion-works`** — umbrella; cross-link.
- **`tools-hub` (StackScout)** — overlap on developer tools. The split: **Repo Foundry tracks repos as projects** (code, releases, contributors); **StackScout tracks tools as products** (used to build something). Same artifact (e.g. an MCP server's repo) can appear in both, framed differently — Repo Foundry's dossier focuses on signals/contributors; StackScout's entry focuses on what it does for you. Cross-link aggressively.
- **`ai-resource-hub`** — overlap on AI infrastructure. AI Resource Hub tracks models + benchmarks (the data layer); Repo Foundry tracks the open-source implementations / tooling around them (the code layer). Cross-link.
- **`games-hub`** — game prototype repos under E-lusion Studios are exactly the kind of content Repo Foundry could dossier. Bidirectional link: GameTrackDaily's game page links to a Repo Foundry dossier for the repo; the dossier links back to the game's GameTrackDaily page.
- **`ghost-in-the-models`** — orthogonal; different beat (editorial publishing, not curation).

---

## Open questions for Kol

Before Claude Design's beauty pass, Kol should confirm:

1. **Codex-adjacent framing** — permanent or launch-only?
2. **Lanes / categories** — confirm the canonical list of category pages (agent infra, MCP servers, evaluation, CLIs, runtimes, etc.).
3. **Signal sources** — which GitHub queries / APIs drive the trend detection?
4. **News sources** — where do news items come from?
5. **Dossier cadence** — how many new repos covered per week?
6. **Visualisations** — confirm the list (language trends, contributor flow, release cadence, topic clusters, others?).
7. **Cross-link policy** — confirm Repo Foundry ↔ StackScout / AI Resource Hub / GameTrackDaily boundaries above.
8. **Domain** — `repofoundry.com` or `.dev` when ready, or sub-domain?

---

## Definition of "this brief is complete"

- [ ] Codex-adjacent framing locked
- [ ] Lane / category list locked
- [ ] Signal source pipeline confirmed
- [ ] News rail editorial workflow agreed
- [ ] Initial dossier set populated (Kol picks N — maybe 20 repos as launch corpus?)
- [ ] Visualisation list locked
- [ ] Cross-link policy agreed with the other 3 hubs' SCOPE briefs
- [ ] Domain deferred until growth visible
- [ ] Claude Design briefed with this scope + existing `DESIGN.md` + `CLAUDE-DESIGN-HANDOFF.md`

# Repo Foundry Design System

> Part of the wider Kol Tregaskes hub family, but intentionally its own public-facing product.

## Product role

**Name:** Repo Foundry  
**Purpose:** A public discovery site for high-signal open-source repositories, trend watching, category mapping, and Codex-adjacent tooling references.  
**Tone:** Editorial, technical, and operator-minded. This should feel less like a dashboard and more like a curated foundry floor.

## Current direction

Repo Foundry already has:

- a shared codebase that builds both public and internal outputs
- a dark atmospheric emerald theme
- a magazine-style homepage
- public pages for signals, library, news, visualisations, Codex resources, about
- repo dossier pages
- lane/category pages for the main public shelves

The current phase is not the final beauty pass. The goal is to keep the structure strong, the routes clear, and the public/private boundary strict so a later dedicated design pass can go much further without reworking the foundations.

## Design stance

### Visual language

- Dark glass panels on a deep blue-black field
- Emerald as the primary accent, with blue and amber support tones
- Serif display typography for headings, technical grotesk for structure and scanning
- Atmosphere layers that create depth without turning the site into generic neon sci-fi

### UX stance

- Newest or most important items should surface first
- Categories should behave like real shelves, not just tags
- Repo cards must answer three questions quickly:
  - what it is
  - why it matters
  - what we might use it for
- Public pages should read comfortably to non-coders while still feeling credible to technical users

## Public route map

- `/`
- `/trending`
- `/repos`
- `/repos/:slug`
- `/lanes`
- `/lanes/:laneId`
- `/news`
- `/visualisations`
- `/resources/codex`
- `/about`

## Internal route map

- `/internal`
- `/internal/tracked-repos`
- `/internal/backlog`
- `/internal/sessions`
- `/internal/ops`
- `/internal/knowledge`
- `/internal/cadence`

## Boundary rules

Public output may include:

- repo names
- repo URLs
- stars
- categories
- tags
- summaries
- why-it-matters copy
- potential-use copy
- public-safe news items
- public-safe category and trend snapshots

Public output must never include:

- local file paths
- workspace-only repo status
- manager notes
- private handoffs
- session state
- backlog ownership
- database or inbox health
- operational startup/runtime details

## Next design pass

When Claude Code or a dedicated design session takes over, the likely areas to push further are:

1. Hero composition and typography hierarchy
2. Editorial rhythm on homepage and lane pages
3. Visualisation presentation
4. Card polish and hover behaviour
5. Brand identity details such as logos, marks, and richer section art

The structural work should already be stable enough that the next pass can focus on quality rather than repair.

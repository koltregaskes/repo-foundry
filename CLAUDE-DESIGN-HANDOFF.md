# Claude Design Handoff

This note is for handing the Repo Foundry website over to Claude Code and the design tool for the dedicated visual pass.

## 1. Company name and blurb

**Company / website name**

Repo Foundry

**Blurb**

Repo Foundry is a public, editorial-style website for discovering high-signal open-source repositories across AI command centres, coding-agent infrastructure, workflow automation, productivity tooling, and creator systems. It should feel like a curated magazine and repo intelligence surface rather than a generic directory.

## 2. Assets

**Primary GitHub repo**

- `https://github.com/koltregaskes/repo-foundry`

**Primary local folder**

- `W:\Repos\_My Open Source\repo-foundry`

**Most useful folders/files for the design pass**

- `W:\Repos\_My Open Source\repo-foundry\src\templates\public.mjs`
- `W:\Repos\_My Open Source\repo-foundry\src\templates\layout.mjs`
- `W:\Repos\_My Open Source\repo-foundry\src\assets\shared.css`
- `W:\Repos\_My Open Source\repo-foundry\src\assets\public-app.js`
- `W:\Repos\_My Open Source\repo-foundry\content\public\generated\site-data.json`
- `W:\Repos\_My Open Source\repo-foundry\DESIGN.md`

**Current public output**

- `W:\Repos\_My Open Source\repo-foundry\dist\public`

**Current local preview**

- `http://127.0.0.1:4789/preview/index.html`

## 3. Other notes

### Product direction

Repo Foundry is the public-facing sibling to a private internal repo research system, but the public site is its own product.

It should present:

- curated trending repositories
- category or lane-based browsing
- repo dossier pages
- public-safe news and editorials
- visualisations and snapshots
- a strong Codex / coding-agent shelf

It should not feel like an internal admin console. The tone should be editorial, technical, and confident.

### Design intent

Current direction:

- dark atmospheric base
- emerald-led palette with blue and amber support tones
- magazine-style hierarchy rather than dashboard clutter
- strong category shelves called "lanes"
- practical, operator-minded tone

The design should feel:

- sharp
- curated
- slightly premium
- technical without being cold
- readable by both developers and non-coders

Avoid:

- generic SaaS cards everywhere
- purple-on-white AI aesthetics
- overly corporate B2B styling
- cluttered admin/dashboard energy on the public site

### What already exists

The structural phase is already in place.

Public routes already exist for:

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

The current site already has:

- a homepage
- repo cards
- lane/category pages
- repo detail pages
- news page
- visualisations page
- Codex resources page
- basic dark-theme shared styling

### What the next design pass should improve

This is where Claude should really push:

1. Hero design and top-of-page identity
2. Stronger editorial composition on the homepage
3. Better visual distinction between pages and sections
4. More beautiful lane pages
5. Stronger repo card art direction and hierarchy
6. Better visualisations presentation
7. Higher-quality brand feel overall

### Public/private boundary

This is important.

The public site must not expose:

- local file paths
- internal session data
- private backlog/work packet data
- manager notes
- internal ops health
- private repo telemetry

The public build must stay public-safe and curated.

### Features still to add later

Not all of this needs to happen in the design pass, but it should be kept in mind:

1. Better editorial/news cadence
2. Richer visualisations
3. More polished search/filter UX
4. Featured collections or themed roundups
5. Stronger branding assets such as logo/mark if we decide to create them
6. Public deployment polish and final domain/SEO pass

### Things the user may still need to do

1. Decide whether Repo Foundry gets a dedicated final domain separate from any temporary URLs
2. Decide whether to create a bespoke logo/mark or let the design system establish the wordmark first
3. Approve any big visual shift Claude proposes
4. Provide any external references if we want the visual language to lean toward a specific publication or product family

### Claude Code research note

I checked Anthropic's current official Claude Code product and docs before writing this handoff.

The practical takeaway is:

- Claude Code is designed to work against a real codebase, not just a prompt
- it can read the project, edit files across multiple paths, run commands, and iterate
- it is available across terminal, IDE, desktop, and web surfaces
- for a design pass like this, giving Claude the actual Repo Foundry folder and repo is the right move

Official references:

- `https://www.anthropic.com/product/claude-code`
- `https://code.claude.com/docs/en/overview`
- `https://code.claude.com/docs/en/setup`

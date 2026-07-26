# Repo Foundry Autoresearch

## Purpose

Repo Foundry uses a local-first research pipeline. Raw scout data stays in the private runtime, and only public-safe fields are compiled into the public site.

## Automation chain

Current rhythm:

1. Daily scout
2. Public compile
3. Public publish
4. Evening refresh
5. Weekly dossier refresh

## Current private data source

Preferred active source:

- `W:\Repos\_local\surfaces\repo-foundry-internal\data`

Legacy compatibility source:

- `W:\Repos\_local\surfaces\repos-hub\local-hub\data`

Repo Foundry should prefer the active internal runtime path and only fall back to legacy compatibility when needed.

## Public boundary

Allowed into `content/public/generated/site-data.json`:

- repo name
- public repo URL
- stars
- category
- tags
- summary
- why it matters
- potential use
- public-safe freshness and trend metadata

Not allowed:

- local paths
- session updates
- backlog ownership
- manager notes
- internal ops status
- database details

## Routed public news contract

The public build consumes `content/public/generated/news-feed-latest.json` directly for the news shelf.
It rejects the build when that feed, or its newest article, is more than three days old. The compiled
site records the exact consumer path and source timestamps in `sourceProvenance.news`.

Run `npm run validate:public` before review. It proves the routed consumer, checks source age, builds
the site, and scans the output for local workspace, session, checkout, and database leakage.

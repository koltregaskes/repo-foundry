# repo-foundry

## Purpose

This repo is the canonical shared codebase for Repo Foundry.

It builds:

- the internal local runtime at `W:\Repos\_local\surfaces\repo-foundry-internal`
- the public static site for GitHub Pages

## Rules

- Keep the public boundary strict.
- Treat `content/public` as publishable.
- Treat internal runtime data as local-only unless it is compiled into the allowlisted public schema first.
- Prefer static-first, dependency-light build steps.
- Keep GitHub Pages output free of local workspace paths and operational metadata.

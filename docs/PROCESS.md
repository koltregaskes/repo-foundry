# Repo Foundry Process

## Purpose

Repo Foundry has two outputs from one codebase:

- a public site in `dist/public`
- an internal runtime in `W:\Repos\_local\surfaces\repo-foundry-internal`

## Standard workflow

1. Update public-safe source code or docs in the repo.
2. If the data contract changes, run `node ./scripts/compile-public-data.mjs`.
3. Rebuild everything with `node ./scripts/rebuild-all.mjs` or `npm.cmd run build:all`.
4. Verify the important routes.
5. Only then commit and push repo-local changes.

## Verification baseline

Minimum checks:

- `node --check` for edited `.mjs` or `.js` files
- public preview route returns `200`
- any newly added route returns `200`
- public output does not contain local paths or private manager data

## Publish rule

Public repo commits should contain only Repo Foundry repo-local changes. Do not mix workspace-only files, private local hub files, or unrelated estate edits into the same commit.

## Handoff rule

When handing design or implementation to another session:

- leave a durable local or repo-backed note
- name the target tool or session explicitly
- include the product direction, files to use, and privacy boundary

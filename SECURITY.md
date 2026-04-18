# Security Policy

## Reporting

If you discover a security issue in `repo-foundry`, please report it privately first.

Until a dedicated security inbox is published, do not open a public issue containing:

- secrets
- private workspace paths
- internal operational notes
- unpublished repo research or manager-only data

## Scope

The most important security rule in this project is data separation:

- public output must only come from allowlisted public-safe fields
- internal runtime data must not leak into committed public assets

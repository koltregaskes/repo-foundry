# repo-foundry

`repo-foundry` is the shared codebase for the Repo Foundry programme.

It produces two real outputs from one source:

- `internal`: the private operational surface for the Repos workspace
- `public`: the public-facing discovery site for trending repos, news, visualisations, and Codex-adjacent resources

## Layout

```text
repo-foundry/
  content/public/manual/      # public editorial seed content
  scripts/                    # compilers and build scripts
  src/assets/                 # shared CSS and browser code
  src/internal-runtime/       # internal hub server/runtime sources
  src/lib/                    # build helpers and data contracts
  src/templates/              # HTML page builders
  dist/public/                # generated public site
```

## Commands

```powershell
npm run compile:public
npm run build:public
npm run build:internal
npm run build:all
```

## Outputs

- Public build: `W:\Repos\_My Open Source\repo-foundry\dist\public`
- Internal runtime: `W:\Repos\_local\surfaces\repo-foundry-internal`

## Public routes

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

## Public boundary

The public site is generated only from allowlisted public-safe fields.
It must never publish local paths, session data, backlog ownership, manager notes, or workspace-only repo telemetry.

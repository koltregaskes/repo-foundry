# repos-hub

`repos-hub` is the shared codebase for the Repos Hub programme.

It produces two real outputs from one source:

- `internal`: the private operational surface for the Repos workspace
- `public`: the public-facing discovery site for trending repos, news, visualisations, and Codex-adjacent resources

## Layout

```text
repos-hub/
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

- Public build: `W:\Repos\_My Open Source\repos-hub\dist\public`
- Internal runtime: `W:\Repos\_local\surfaces\repos-hub-internal`

## Public boundary

The public site is generated only from allowlisted public-safe fields.
It must never publish local paths, session data, backlog ownership, manager notes, or workspace-only repo telemetry.

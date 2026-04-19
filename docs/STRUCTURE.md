# Repo Foundry Structure

## Main folders

- `content/public/generated` - compiled public-safe data
- `dist/public` - generated public site output
- `scripts` - compile and build entry points
- `src/assets` - shared CSS and browser code
- `src/lib` - data contracts, constants, compile helpers
- `src/templates` - page builders for public and internal HTML
- `src/internal-runtime` - internal runtime server and support scripts
- `docs` - agent-facing operating notes

## Most common edit points

### Public page layout

- `src/templates/public.mjs`

### Shared visual system

- `src/assets/shared.css`

### Client behaviour

- `src/assets/public-app.js`

### Data shaping

- `src/lib/compile.mjs`
- `src/lib/manual-content.mjs`

### Runtime/data paths

- `src/lib/constants.mjs`

### Internal server

- `src/internal-runtime/hub_server.py`

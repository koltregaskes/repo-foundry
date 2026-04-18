# Contributing

Thanks for helping with `repo-foundry`.

## Principles

- keep the public boundary strict
- keep the build static-first and dependency-light
- prefer clear editorial quality over noisy automation
- do not commit secrets, machine-local paths, or private workspace notes

## Workflow

1. update or add the relevant source data
2. run `npm run build:all`
3. verify the public build contains only public-safe data
4. verify the internal runtime still renders manager-only features locally
5. commit only the intended scope

## Pull requests

- explain which audience changed: `public`, `internal`, or `both`
- call out any privacy-boundary changes explicitly
- include the exact verification commands you ran

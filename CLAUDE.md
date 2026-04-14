# Shingle

Monorepo for rafters-studio sites (runlegion.dev, sean.silvius.me, huttspawn.com, gitpress.app, rafters.studio, smugglr.dev, mail.rafters.studio).

## Hard rules

These re-parse every turn. Do not demote to memory — they exist here precisely because they drift back under idle-gap pressure.

### Rafters consumer rules

- Use `rafters@latest` in `package.json`, `pnpx` calls, and MCP config. Never pin a version.
- Never edit registry-installed files: `*.classes.ts`, `classy.ts`, `primitives/`, or any `.astro` installed by `rafters add`. They overwrite on upgrade. If the tool is wrong, file upstream; if a warning is real, fix the consumer code.
- Never write raw CSS variable overrides (e.g. `:root { --rafters-primary: ... }`). All token mutations go through the `rafters_token` MCP tool.
- Before any `rafters_token` call: read `.mcp.json` and confirm `--project-root` points at the site you intend to mutate. The MCP subprocess is pinned at session start and cannot be redirected per call. If wrong, edit `.mcp.json` and restart Claude.
- Never `git checkout` on `.rafters/tokens/*.json` to revert a bad write. Use `rafters_token reset` through MCP. The JSON files are storage for the registry, not a source of truth.
- Load the `rafters-frontend` skill and consult `rafters_component` / `rafters_pattern` / `rafters_vocabulary` before writing UI with Rafters components. Do not guess APIs from training data.

### Checks and signals

Never disable a11y rules, linter rules, or test assertions to make CI green. Fix the root cause. Failing output is information.

### Voice (prose, docs, PR bodies, commits)

- No em dashes. Use colons, semicolons, commas, or restructure.
- No bullet lists in prose. Lists belong in specs and reference material.
- MLA conventions, direct first-person where appropriate.

### Scope

This is a monorepo with two active checkout paths (`/Volumes/store/projects/rafters-studio/shingle` and `/Users/seansilvius/projects/shingle`) that carry different branches. Before any `Edit` or `Write` whose target leaves `sites/<site>/`, confirm scope. When files appear missing, verify `pwd` and `git branch` before assuming loss.

## Branching and PRs

- Never push to `main`. Always feature-branch and open a PR.
- `legion pr create --repo shingle ...` is the path; direct `gh` is blocked.
- Run `legion-simplify` before opening a PR.

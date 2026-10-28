# shingle

The static sites for rafters-studio's products, in one pnpm workspace. Each site is an Astro project that builds to static HTML and is served as its own Cloudflare Worker.

| Site | Directory | What it is |
|---|---|---|
| [rafters.studio](https://rafters.studio) | `sites/rafters.studio` | Rafters, the design system. Includes `/mail` and `/kelex` on the same origin. |
| [runlegion.dev](https://runlegion.dev) | `sites/runlegion.dev` | Legion, the agent team runtime. |
| [smugglr.dev](https://smugglr.dev) | `sites/smugglr.dev` | smugglr, the sync tool, and migratr. |
| [gitpress.app](https://gitpress.app) | `sites/gitpress.app` | gitpress. |

Two packages are shared between the sites:

- `packages/shared` (`@shingle/shared`) holds the shared header, footer and head, and the site metadata built on [@rafters/astro-meta](https://www.npmjs.com/package/@rafters/astro-meta): sitemap, robots.txt, llms.txt and JSON-LD.
- `packages/install` (`@shingle/install`) holds the install and download components the product sites use.

## Requirements

- Node 24 (see `.node-version`)
- pnpm 12.9.1, pinned in `package.json`. Corepack or a matching global pnpm both work.

Tool versions come from [@rafters/toolchain](https://www.npmjs.com/package/@rafters/toolchain), installed as a pnpm config dependency. `catalog:` in a package.json resolves to the toolchain's version.

## Commands

From the repository root:

```sh
pnpm install
pnpm lint        # every package that has a lint script
pnpm typecheck   # astro sync, astro-check and tsc, one site at a time
pnpm test
pnpm build       # every site, one at a time
pnpm preflight   # lint, typecheck, build and test in that order
pnpm exec toolchain drift   # fails if a package pins a toolchain-managed version
```

To work on one site, run its scripts from its directory, for example `pnpm dev` or `pnpm build` in `sites/smugglr.dev`. Each site's `wrangler.jsonc` names its Worker and the domain it serves.

## How changes land

Every change goes through a pull request. `main` is protected by a ruleset: commits must be signed, and a pull request merges through the merge queue only after Toolchain drift, Lint, Typecheck, Unit Tests and Build pass. Force-pushing to `main` and deleting it are blocked.

Cloudflare Workers Builds builds and deploys rafters.studio, runlegion.dev and smugglr.dev when a change merges to `main`. There is no deploy step to run by hand.

## Who owns what

The shared infrastructure belongs to rafters-studio's platform: the workspace, `packages/shared`, the build and indexing. Each site's pages, copy and design belong to that product's team.

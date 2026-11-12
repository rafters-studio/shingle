/**
 * Single source for the brand string and the site description.
 *
 * Both used to be written out by hand in `astro.config.mjs` (feeding the
 * build-time meta artifacts) and again in `src/layouts/Base.astro` (feeding
 * the per-page tags). That is how the name stayed misspelled: a copy on one
 * side could be corrected while the other kept the old value, with nothing
 * linking them.
 *
 * The brand is lowercase in every position, including sentence-initially.
 */
export const SITE_NAME = "smugglr";

export const SITE_DESCRIPTION =
  "smugglr keeps SQLite databases in step: a local file, a service that speaks HTTP-SQL, or Cloudflare D1. One Rust binary. sync and sync --discover for two places, mesh for a local network, stash and retrieve (multi) for a person’s own devices, exec for migratr, JSON on request and exit codes that say what happened.";

/** Shorter form used by the structured-data graph, which has its own length budget. */
export const SITE_DESCRIPTION_SHORT =
  "Keeps SQLite databases in step: files, HTTP-SQL services, D1 and a LAN mesh. One Rust binary.";

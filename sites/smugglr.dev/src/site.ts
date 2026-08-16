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
  "smugglr is a universal SQLite sync engine. Fast, stateless, encrypted. LAN broadcast, S3 relay, and agent-friendly JSON output.";

/** Shorter form used by the structured-data graph, which has its own length budget. */
export const SITE_DESCRIPTION_SHORT =
  "Universal SQLite sync engine. LAN broadcast, S3 relay, agent-friendly output.";

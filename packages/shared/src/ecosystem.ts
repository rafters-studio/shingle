/**
 * The rafters-studio product ecosystem: the single source of truth for the
 * cross-site graph.
 *
 * This list is consumed in two places that must never drift: MegaFooter renders
 * it as the shared "Projects" column, and the meta layer feeds the same URLs to
 * the organization's `sameAs` in the JSON-LD graph. The footer and the
 * structured-data org node are two projections of one list.
 *
 * `key` is a stable identifier (not a host) used to self-omit the current site,
 * because rafters.studio and mail.rafters.studio share the rafters.studio host.
 */
export interface EcosystemProject {
  key: string;
  label: string;
  href: string;
}

export const PROJECTS = [
  { key: "rafters", label: "Rafters", href: "https://rafters.studio" },
  { key: "legion", label: "Legion", href: "https://runlegion.dev" },
  { key: "mail", label: "Mail", href: "https://rafters.studio/mail/" },
  { key: "gitpress", label: "Gitpress", href: "https://gitpress.app" },
  { key: "smuggler", label: "smugglr", href: "https://smugglr.dev" },
  { key: "kelex", label: "Kelex", href: "https://rafters.studio/kelex/" },
  { key: "ledger", label: "Ledger", href: "https://github.com/rafters-studio/ledger" },
  { key: "veneer", label: "Veneer", href: "https://github.com/rafters-studio/veneer" },
] as const satisfies readonly EcosystemProject[];

/**
 * Stable identifier for each ecosystem entry, derived from PROJECTS so the key
 * union cannot drift from the data and every key is by construction a real row.
 */
export type ProjectKey = (typeof PROJECTS)[number]["key"];

/** Canonical https URLs for the ecosystem, used as the organization `sameAs`. */
export const ecosystemSameAs: readonly string[] = PROJECTS.map((p) => p.href);

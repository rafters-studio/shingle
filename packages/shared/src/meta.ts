/**
 * Shared @rafters/astro-meta wiring for every shingle site.
 *
 * astro-meta is configured once here, not per site. `defineSharedMeta` takes a
 * site's identity and returns the full `astroMeta()` options with the
 * studio-wide defaults applied: the Rafters Studio organization entity (whose
 * `sameAs` is the ecosystem list, the same data the footer renders), the
 * AI-crawler robots policy, the Cloudflare Content-Signals header, the sitemap
 * and llms.txt sources derived from the site's pages, and a non-blocking GEO
 * audit. Each site passes only its own `site` identity.
 */
import { astroMeta } from "@rafters/astro-meta/astro";
import type { AstroMetaOptions } from "@rafters/astro-meta/astro";
import { defineSite } from "@rafters/astro-meta";
import type { SiteIdentity } from "@rafters/astro-meta";
import { defineEntities } from "@rafters/astro-meta/entities";
import { article, breadcrumbList, mergeGraph, softwareApplication } from "@rafters/astro-meta/schema";
import type { JsonLdObject } from "@rafters/astro-meta/schema";
import { ecosystemSameAs } from "./ecosystem";
import { collectPages } from "./collect-pages";
import { collectDistBodies } from "./collect-dist";

// Re-export the per-page schema builders so sites depend only on @shingle/shared
// and never name @rafters/astro-meta directly (avoids a pnpm phantom dependency).
export { astroMeta, defineSite, collectPages, collectDistBodies, article, breadcrumbList, mergeGraph, softwareApplication };
export type { SiteIdentity, AstroMetaOptions, JsonLdObject };

/** The studio organization. Identical across every site; only the WebSite node varies. */
export const RAFTERS_STUDIO = {
  id: "https://rafters.studio/#org",
  name: "Rafters Studio",
  url: "https://rafters.studio",
  logo: "https://rafters.studio/rafters-logo.svg",
} as const;

/**
 * The org + WebSite JSON-LD graph for a site's head, plus any per-page nodes the
 * layout supplies (a SoftwareApplication on a product home, a TechArticle on a
 * docs page). The organization is the studio (shared, with the ecosystem as
 * `sameAs`); the WebSite node is the current site. `extra` nodes are merged by
 * `@id`, so a page references the org and website by id and the graph resolves.
 * Layouts pass the result to `<SchemaScript>`.
 */
export async function buildSiteGraph(
  site: SiteIdentity,
  extra: readonly JsonLdObject[] = [],
): Promise<JsonLdObject[]> {
  const orgModule = defineEntities({
    organization: {
      "@id": RAFTERS_STUDIO.id,
      name: RAFTERS_STUDIO.name,
      url: RAFTERS_STUDIO.url,
      logo: RAFTERS_STUDIO.logo,
      sameAs: ecosystemSameAs,
    },
  });
  const orgGraph = await orgModule.schema({ ctx: { site } });
  const orgObjects = Array.isArray(orgGraph) ? orgGraph : [orgGraph];
  const website: JsonLdObject = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description ?? "",
    publisher: { "@id": RAFTERS_STUDIO.id },
  };
  return mergeGraph([...orgObjects, website, ...extra]);
}

function sectionForRoute(route: string): string {
  const top = route.split("/").filter(Boolean)[0];
  if (top === undefined) return "Home";
  return top.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface SharedMetaOptions {
  /** This site's identity. */
  site: SiteIdentity;
  /** Pages directory to derive sitemap and llms.txt entries from. Default "src/pages". */
  pagesDir?: string;
  /** Path-prefix arrays excluded from llms.txt (mirrors a robots disallow). */
  llmsDisallow?: readonly string[];
}

/**
 * Build the `astroMeta()` options for a site from its identity plus the
 * studio-wide defaults. Sitemap covers every page; llms.txt covers pages that
 * carry a markdown body (so `.astro` shells are excluded automatically).
 */
export function defineSharedMeta(opts: SharedMetaOptions): AstroMetaOptions {
  const { site, pagesDir } = opts;
  const absolute = (route: string) => `${site.url}${route}`;

  return {
    site,
    robots: {
      rules: [{ userAgent: "*", allow: ["/"], ...(opts.llmsDisallow ? { disallow: opts.llmsDisallow } : {}) }],
      contentSignals: {
        policy: { search: "yes", aiInput: "yes", aiTrain: "no" },
        enforce: "declarative",
      },
    },
    sitemap: {
      sources: [
        {
          key: ["pages"],
          collect: async () => {
            const pages = await collectPages({ pagesDir });
            return pages.map((p) => ({ url: absolute(p.route), lastmod: p.lastmod }));
          },
        },
      ],
    },
    llmsTxt: {
      full: true,
      sources: [
        {
          key: ["pages"],
          collect: async () => {
            // Titles and descriptions come from authored frontmatter, which was
            // never broken. Only bodies move to the rendered output, because
            // page source is component wiring rather than content, and .astro
            // pages have no source body at all.
            const [pages, bodies] = await Promise.all([
              collectPages({ pagesDir }),
              collectDistBodies(),
            ]);
            return pages
              .map((p) => ({ page: p, body: bodies.get(p.route) }))
              .filter((entry) => entry.body !== undefined)
              .map(({ page, body }) => ({
                title: page.title,
                url: page.route,
                summary: page.description,
                body,
                section: sectionForRoute(page.route),
              }));
          },
        },
      ],
    },
    audit: { threshold: 0, failBuild: false },
  };
}

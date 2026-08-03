/**
 * The site's nav, in one place.
 *
 * There were three headers rendering three different link sets: SiteHeader
 * carried seven, TopBar carried two, and Docs.astro inlined a fourth copy
 * carrying the same two. On /compare/ two of them rendered on the same page
 * with different marks and different links, which is what "the site has two
 * topbars" describes from a reader's side.
 *
 * The links live here rather than in a component so the header that scrolls
 * away and the header that fades in cannot disagree about where the site
 * goes.
 */
export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "docs", href: "/docs/" },
  { label: "cli", href: "/docs/cli-reference/" },
  { label: "targets", href: "/#targets" },
  { label: "shapes", href: "/#shapes" },
  { label: "compare", href: "/compare/" },
  { label: "games", href: "/compare/games/" },
  { label: "github", href: "https://github.com/rafters-studio/smugglr" },
];

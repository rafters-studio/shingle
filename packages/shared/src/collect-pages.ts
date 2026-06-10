/**
 * Filesystem page collector for pages-based Astro sites.
 *
 * astro-meta's sitemap and llms.txt sources call `collect(ctx)` in the
 * integration's Node context at build:done, so a collector cannot use
 * `astro:content`. The shingle marketing and docs sites are pages-based
 * (`src/pages/**`), not content collections, so this walks the pages directory
 * directly, reads frontmatter, and derives routes. Build runs with the site
 * directory as cwd, so the default `pagesDir` of "src/pages" resolves correctly.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import matter from "gray-matter";

export interface CollectedPage {
  /** Route path with leading slash and a trailing slash for non-root routes. */
  route: string;
  title: string;
  description?: string;
  /** Markdown body (frontmatter stripped); absent for `.astro` pages. */
  body?: string;
  lastmod?: Date;
}

const PAGE_EXTENSIONS = new Set([".mdx", ".md", ".astro"]);

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (PAGE_EXTENSIONS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** `docs/getting-started.mdx` -> `/docs/getting-started/`; `index.mdx` -> `/`. */
function toRoute(relPath: string): string {
  const noExt = relPath.slice(0, relPath.length - extname(relPath).length);
  const segments = noExt.split(/[\\/]/).filter((s) => s !== "index");
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
}

function titleFromRoute(route: string): string {
  const segments = route.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "home";
  return last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Strip MDX noise that is not prose content: top-level ESM `import`/`export`
 * statements (the component import block at the top of every MDX page) and
 * runs of blank lines they leave behind. This keeps llms-full.txt readable
 * instead of dumping the page's component wiring to crawlers.
 */
function stripMdxNoise(src: string): string {
  return src
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function collectPages(opts: { pagesDir?: string } = {}): Promise<CollectedPage[]> {
  const pagesDir = opts.pagesDir ?? "src/pages";
  const files = await walk(pagesDir);
  const pages = await Promise.all(
    files.map(async (file): Promise<CollectedPage> => {
      const route = toRoute(relative(pagesDir, file));
      const lastmod = (await stat(file)).mtime;
      if (extname(file) === ".astro") {
        return { route, title: titleFromRoute(route), lastmod };
      }
      const { data, content } = matter(await readFile(file, "utf-8"));
      const body = stripMdxNoise(content);
      return {
        route,
        title: typeof data.title === "string" ? data.title : titleFromRoute(route),
        description: typeof data.description === "string" ? data.description : undefined,
        body: body.length > 0 ? body : undefined,
        lastmod,
      };
    }),
  );
  return pages.sort((a, b) => a.route.localeCompare(b.route));
}

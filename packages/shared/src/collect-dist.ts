/**
 * Rendered-HTML body collector for llms-full.txt.
 *
 * The source walk in `collect-pages.ts` reads `src/pages/**`, which is the
 * wrong artifact for a body. An MDX page's source is component wiring, so
 * `llms-full.txt` shipped literal `<SiteHeader /> <VoiceHero /> <MrsBlock />`
 * as the homepage "content" on smugglr.dev, and `.astro` pages produced no
 * body at all. The irony that motivates this: smugglr's machine-readable
 * summary block, written specifically for agents, was invisible in the agent
 * artifact because it lives inside a component.
 *
 * At `build:done` the rendered output already exists, and it contains every
 * component's output including `.astro` pages. So bodies come from `dist`,
 * while titles and descriptions keep coming from authored frontmatter, which
 * was never broken.
 *
 * `linkedom` is the same parser `@rafters/astro-meta/audit` already uses to
 * walk generated routes, so this adds no dependency.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseHTML } from "linkedom";

/**
 * Landmark chain, most specific first. `article` is the prose region on sites
 * that mark one; `main` is the page region everywhere else.
 *
 * There is deliberately no `body` fallback. A page with neither landmark gets
 * no body rather than a nav dump, because llms-full.txt is read by agents
 * making decisions and a page of chrome is worse than an absent entry: it
 * costs context and answers nothing. gitpress.app is the live case, its Base
 * layout marks no landmark at all.
 */
const CONTENT_SELECTORS = ["article", "main"] as const;

/** Removed before conversion: chrome and non-prose that can sit inside a landmark. */
const STRIP_SELECTORS = ["nav", "header", "footer", "script", "style", "noscript", "[aria-hidden='true']"];

const BLOCK_HANDLERS = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6",
  "P", "UL", "OL", "PRE", "TABLE", "BLOCKQUOTE", "HR",
]);

export interface DistBody {
  /** Route with leading slash and trailing slash for non-root routes. */
  route: string;
  /** Markdown converted from the page's content landmark. */
  body: string;
}

export interface CollectDistOptions {
  /** Build output directory. Build runs with the site dir as cwd. */
  distDir?: string;
  /** Reported per skipped route; defaults to stderr. */
  warn?: (message: string) => void;
}

/**
 * Resolve where rendered HTML actually lives under the build output.
 *
 * A static build writes pages to `dist/` directly. A server build writes
 * `dist/client/` and `dist/server/`, so walking `dist` yields routes prefixed
 * with `/client/` that match nothing in the source walk, and every body is
 * silently dropped. gitpress.app is the live case and is why this exists:
 * verifying only on a static site would have shipped that.
 */
async function resolveHtmlRoot(distDir: string): Promise<string> {
  try {
    const clientDir = join(distDir, "client");
    if ((await stat(clientDir)).isDirectory()) return clientDir;
  } catch {
    // No client/ subdirectory: static output, pages live at the root.
  }
  return distDir;
}

async function walkHtml(dir: string): Promise<string[]> {
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
      out.push(...(await walkHtml(full)));
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

/** `docs/index.html` -> `/docs/`; `index.html` -> `/`. Matches collect-pages' route shape. */
function routeFromHtmlPath(relPath: string): string {
  const segments = relPath.split(sep).filter((s) => s.length > 0);
  const last = segments[segments.length - 1];
  if (last === "index.html") segments.pop();
  else if (last !== undefined) segments[segments.length - 1] = last.replace(/\.html$/, "");
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
}

const inlineEscape = (text: string): string => text.replace(/([\\`*_[\]])/g, "\\$1");

/**
 * Inline conversion. Links keep their href because a URL is often the most
 * actionable thing on the page for an agent; everything else collapses to its
 * text, since bold and italic carry no meaning a reader needs here.
 */
function inlineMarkdown(node: Node): string {
  const TEXT_NODE = 3;
  if (node.nodeType === TEXT_NODE) return inlineEscape(node.textContent ?? "");
  const el = node as Element;
  const children = Array.from(el.childNodes).map(inlineMarkdown).join("");
  switch (el.tagName) {
    case "CODE":
      return `\`${el.textContent ?? ""}\``;
    case "A": {
      const href = el.getAttribute("href");
      return href && children.trim().length > 0 ? `[${children}](${href})` : children;
    }
    case "BR":
      return "\n";
    default:
      return children;
  }
}

const collapse = (s: string): string => s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();

function listMarkdown(el: Element, ordered: boolean): string {
  const items = Array.from(el.children).filter((c) => c.tagName === "LI");
  const lines: string[] = [];
  let index = 1;
  for (const item of items) {
    const marker = ordered ? `${index}. ` : "- ";
    lines.push(`${marker}${collapse(inlineMarkdown(item)).replace(/\n/g, " ")}`);
    index += 1;
  }
  return lines.join("\n");
}

function tableMarkdown(el: Element): string {
  const rows = Array.from(el.querySelectorAll("tr"));
  if (rows.length === 0) return "";
  const cellsOf = (row: Element): string[] =>
    Array.from(row.children)
      .filter((c) => c.tagName === "TH" || c.tagName === "TD")
      .map((c) => collapse(inlineMarkdown(c)).replace(/\n/g, " ").replace(/\|/g, "\\|"));
  const header = cellsOf(rows[0] as Element);
  if (header.length === 0) return "";
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const row of rows.slice(1)) {
    const cells = cellsOf(row as Element);
    if (cells.length > 0) lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

function blockMarkdown(el: Element): string {
  const tag = el.tagName;
  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1));
    const text = collapse(inlineMarkdown(el)).replace(/\n/g, " ");
    return text.length > 0 ? `${"#".repeat(level)} ${text}` : "";
  }
  switch (tag) {
    case "P":
      return collapse(inlineMarkdown(el));
    case "UL":
      return listMarkdown(el, false);
    case "OL":
      return listMarkdown(el, true);
    case "PRE": {
      const text = (el.textContent ?? "").replace(/\n+$/, "");
      return text.length > 0 ? `\`\`\`\n${text}\n\`\`\`` : "";
    }
    case "TABLE":
      return tableMarkdown(el);
    case "BLOCKQUOTE":
      return collapse(inlineMarkdown(el))
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "HR":
      return "---";
    default:
      return "";
  }
}

/**
 * Walk in document order, emitting a block when one is recognised and
 * descending otherwise. Descending on unrecognised elements is what makes this
 * work against component output: the wrappers Rafters emits (Container, Grid,
 * Section) are divs with no markdown meaning, and the prose is underneath them.
 */
function convert(root: Element): string {
  const blocks: string[] = [];
  const visit = (el: Element): void => {
    if (BLOCK_HANDLERS.has(el.tagName)) {
      const md = blockMarkdown(el);
      if (md.length > 0) blocks.push(md);
      return;
    }
    for (const child of Array.from(el.children)) visit(child);
  };
  visit(root);
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Convert one page's HTML to markdown. Returns undefined when no landmark is present. */
export function htmlToMarkdown(html: string): string | undefined {
  const { document } = parseHTML(html);
  let region: Element | null = null;
  for (const selector of CONTENT_SELECTORS) {
    region = document.querySelector(selector);
    if (region) break;
  }
  if (!region) return undefined;
  for (const selector of STRIP_SELECTORS) {
    for (const node of Array.from(region.querySelectorAll(selector))) node.remove();
  }
  const markdown = convert(region);
  return markdown.length > 0 ? markdown : undefined;
}

/**
 * Collect rendered bodies keyed by route.
 *
 * Failures are per route and never fail the build: a missing landmark, an
 * unparsable page, or a page that converts to nothing is warned about and
 * omitted. The entry still appears in the llms.txt index via the source walk;
 * only its body is absent. Emitting page source as a fallback is exactly the
 * defect this replaces, so there is no fallback.
 */
export async function collectDistBodies(opts: CollectDistOptions = {}): Promise<Map<string, string>> {
  const distDir = opts.distDir ?? "dist";
  const warn = opts.warn ?? ((message: string) => process.stderr.write(`${message}\n`));
  const htmlRoot = await resolveHtmlRoot(distDir);
  const files = await walkHtml(htmlRoot);
  const bodies = new Map<string, string>();
  for (const file of files) {
    const route = routeFromHtmlPath(relative(htmlRoot, file));
    try {
      const markdown = htmlToMarkdown(await readFile(file, "utf-8"));
      if (markdown === undefined) {
        warn(`[llms-full] ${route}: no <article> or <main> content region; body omitted`);
        continue;
      }
      bodies.set(route, markdown);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      warn(`[llms-full] ${route}: could not convert rendered HTML (${reason}); body omitted`);
    }
  }
  return bodies;
}

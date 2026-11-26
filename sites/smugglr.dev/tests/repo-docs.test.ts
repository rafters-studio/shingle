// shingle #213: the smugglr repo's docs and example READMEs are pages on
// smugglr.dev, copied at the release tag by scripts/smugglr-docs.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ELEMENT_NODE, type ElementNode, type Node, parse, TEXT_NODE, walkSync } from "ultrahtml";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const dist = join(root, "dist");
const pages = join(root, "src/pages/docs");

const release = readFileSync(join(root, "src/smugglr/release.ts"), "utf8");
const tag = `v${/const version = "(\d+\.\d+\.\d+)"/.exec(release)?.[1] ?? ""}`;

type Copy = { file: string; route: string; title: string; source: string; tag: string; body: string };

/** Every page the script wrote: a .md under src/pages/docs/ whose source is the smugglr repo. */
function copies(): Copy[] {
  const out: Copy[] = [];
  for (const entry of readdirSync(pages, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const file = join(entry.parentPath, entry.name);
    const text = readFileSync(file, "utf8");
    const field = (name: string): string => {
      const raw = new RegExp(`^${name}: (.+)$`, "m").exec(text)?.[1];
      return raw === undefined ? "" : (JSON.parse(raw) as string);
    };
    const source = field("source");
    if (!source.startsWith("https://github.com/rafters-studio/smugglr/")) continue;
    const rel = file.slice(pages.length + 1).replace(/\.md$/, "");
    out.push({
      file,
      route: `/docs/${rel}/`,
      title: field("title"),
      source,
      tag: field("tag"),
      body: text.split(/^---$/m).slice(2).join("---"),
    });
  }
  return out.sort((a, b) => a.route.localeCompare(b.route));
}

function text(node: Node): string {
  if (node.type === TEXT_NODE) return node.value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return (node.children ?? []).map(text).join("");
}

function elements(route: string): ElementNode[] {
  const found: ElementNode[] = [];
  walkSync(parse(readFileSync(join(dist, route, "index.html"), "utf8")), (node: Node) => {
    if (node.type === ELEMENT_NODE) found.push(node);
  });
  return found;
}

const all = copies();

describe("docs copied from the smugglr repo", () => {
  it("copies every docs/*.md and examples/*/README.md the four 0.6.4 docs name", () => {
    expect(all.map((c) => c.route)).toEqual([
      "/docs/examples/hono-multi/",
      "/docs/examples/hono-tab/",
      "/docs/integer-keys/",
      "/docs/mesh-protocol/",
    ]);
  });

  for (const copy of all) {
    it(`${copy.route} comes from the release tag the site names`, () => {
      expect(copy.tag).toBe(tag);
      expect(copy.source).toContain(`/blob/${tag}/`);
    });

    it(`${copy.route} is built, titled as its source, with its source's sections in order`, () => {
      const found = elements(copy.route);
      const h1 = found.find((e) => e.name === "h1");
      expect(h1 && text(h1)).toBe(copy.title);
      const sections = [...copy.body.matchAll(/^## (.+)$/gm)].map((m) => m[1]?.trim() ?? "");
      const article = found.find((e) => e.name === "article");
      const h2s: string[] = [];
      if (article) walkSync(article, (n: Node) => n.type === ELEMENT_NODE && n.name === "h2" && h2s.push(text(n)));
      expect(h2s).toEqual(sections);
    });

    it(`${copy.route} links to the file it came from`, () => {
      const hrefs = elements(copy.route).filter((e) => e.name === "a").map((a) => a.attributes["href"]);
      expect(hrefs).toContain(copy.source);
    });

    it(`${copy.route} is in the docs sidebar of every manual page`, () => {
      for (const page of ["docs/cli", "docs/get-started", copy.route]) {
        const nav = elements(page).filter((e) => e.name === "a").map((a) => a.attributes["href"]);
        expect(nav, page).toContain(copy.route);
      }
    });

    it(`${copy.route} is in llms.txt and llms-full.txt`, () => {
      const url = `https://smugglr.dev${copy.route}`;
      expect(readFileSync(join(dist, "llms.txt"), "utf8")).toContain(url);
      expect(readFileSync(join(dist, "llms-full.txt"), "utf8")).toContain(url);
    });
  }
});

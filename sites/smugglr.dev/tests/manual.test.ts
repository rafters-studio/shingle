import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ELEMENT_NODE, type ElementNode, type Node, parse, TEXT_NODE, walkSync } from "ultrahtml";
import { describe, expect, it } from "vitest";
import { parseVersion, smugglrVersion } from "../src/smugglr/version";
import fixture from "./fixtures/manual.json";
import migratrBaseline from "./fixtures/migratr-main.json";

const root = process.cwd();
const dist = join(root, "dist");
const version = smugglrVersion();

function html(route: string): string {
  return readFileSync(join(dist, route, "index.html"), "utf8");
}

function elements(route: string): ElementNode[] {
  const found: ElementNode[] = [];
  walkSync(parse(html(route)), (node: Node) => {
    if (node.type === ELEMENT_NODE) found.push(node);
  });
  return found;
}

function text(node: Node): string {
  if (node.type === TEXT_NODE) return decode(node.value);
  return (node.children ?? []).map(text).join("");
}

function decode(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function article(route: string): ElementNode[] {
  const root = elements(route).find((e) => e.name === "article");
  if (root === undefined) throw new Error(`${route}: no article`);
  const found: ElementNode[] = [];
  walkSync(root, (node: Node) => {
    if (node.type === ELEMENT_NODE) found.push(node);
  });
  return found;
}

const routes = Object.keys(fixture.pages) as (keyof typeof fixture.pages)[];

describe("manual pages", () => {
  it("reads 0.6.2 from the changelog copy", () => {
    expect(version).toBe("0.6.2");
  });

  for (const route of routes) {
    const page = fixture.pages[route];

    it(`${route} shows the version on the mono header line`, () => {
      const header = elements(route).find((e) => e.attributes["data-sidebar"] === "header");
      expect(header && text(header).trim()).toBe(`smugglr manual v${version}`);
    });

    it(`${route} shows every section in order`, () => {
      const headings = article(route).filter((e) => e.name === "h2").map(text);
      expect(headings).toEqual(page.sections);
    });

    it(`${route} carries the artifact's title, lead and path line`, () => {
      const h1 = article(route).find((e) => e.name === "h1");
      expect(h1 && text(h1)).toBe(page.title);
      expect(html(route)).toContain(page.description);
      expect(html(route)).toContain(`smugglr manual / ${page.num} ${page.title.toLowerCase()}`);
    });

    it(`${route} has every output block, byte for byte and in order`, () => {
      const blocks = article(route).filter((e) => e.name === "pre").map(text);
      const expected = page.blocks.map((name) => fixture.out[name as keyof typeof fixture.out]);
      expect(blocks.filter((b) => expected.includes(b))).toEqual(expected);
    });

    it(`${route} is in llms.txt and llms-full.txt with its description`, () => {
      const url = `https://smugglr.dev${route}`;
      const llms = readFileSync(join(dist, "llms.txt"), "utf8");
      expect(llms).toContain(`(${url}): ${page.description}`);
      const full = readFileSync(join(dist, "llms-full.txt"), "utf8");
      expect(full).toContain(url);
      expect(full).toContain(page.description);
    });
  }

  it("/docs/ lists the three manual pages", () => {
    const hrefs = article("docs").filter((e) => e.name === "a").map((a) => a.attributes["href"]);
    expect(hrefs).toEqual(routes);
  });
});

describe("/changelog/", () => {
  const copy = readFileSync(join(root, "src/smugglr/CHANGELOG.md"), "utf8");

  it("renders the changelog copy", () => {
    const headings = article("changelog").filter((e) => e.name === "h2").map(text);
    expect(headings).toContain("[0.6.2] - 2026-11-05");
    expect(copy).toContain("## [0.6.2] - 2026-11-05");
  });

  it("is listed in llms.txt", () => {
    const llms = readFileSync(join(dist, "llms.txt"), "utf8");
    expect(llms).toContain("https://smugglr.dev/changelog/");
    expect(readFileSync(join(dist, "llms-full.txt"), "utf8")).toContain(
      "https://smugglr.dev/changelog/",
    );
  });
});

describe("retired pages", () => {
  const lines = readFileSync(join(dist, "_redirects"), "utf8")
    .split("\n")
    .map((l) => l.trim().split(/\s+/).join(" "));
  const retired: Record<string, string> = {
    "/get-started": "/docs/get-started/",
    "/docs/browser-client": "/docs/get-started/",
    "/docs/how-it-works": "/docs/how-smugglr-decides/",
    "/docs/concepts": "/docs/how-smugglr-decides/",
    "/docs/configuration": "/docs/cli/",
    "/docs/patterns": "/docs/cli/",
    "/docs/plugin-guide": "/docs/cli/",
    "/docs/cli-reference": "/docs/cli/",
  };

  for (const [from, to] of Object.entries(retired)) {
    it(`${from} answers 301 to ${to}, and is gone from llms`, () => {
      expect(lines).toContain(`${from} ${to} 301`);
      expect(lines).toContain(`${from}/ ${to} 301`);
      const url = `https://smugglr.dev${from}/`;
      expect(readFileSync(join(dist, "llms.txt"), "utf8")).not.toContain(url);
      expect(readFileSync(join(dist, "llms-full.txt"), "utf8")).not.toContain(url);
    });
  }

  it("keeps the existing lines", () => {
    const smugglr = "https://raw.githubusercontent.com/rafters-studio/smugglr/main/install.sh";
    const migratr = "https://raw.githubusercontent.com/rafters-studio/migratr/main/install.sh";
    expect(lines.slice(0, 4)).toEqual([
      `/install ${smugglr} 302`,
      `/install.sh ${smugglr} 302`,
      `/migratr/install ${migratr} 302`,
      `/migratr/install.sh ${migratr} 302`,
    ]);
  });
});

describe("version helper", () => {
  it("throws naming the file when there is no version heading", () => {
    const file = join(mkdtempSync(join(tmpdir(), "smugglr-")), "CHANGELOG.md");
    writeFileSync(file, "# Changelog\n\n## [Unreleased]\n");
    expect(() => smugglrVersion(file)).toThrow(file);
    expect(() => parseVersion("# x", "CHANGELOG.md")).toThrow("CHANGELOG.md");
  });

  it("skips [Unreleased] and takes the first release", () => {
    expect(parseVersion("## [Unreleased]\n\n## [1.2.3] - 2026-01-01\n", "f")).toBe("1.2.3");
  });
});

// Hashes of the <main> of each /migratr/ page as it now stands: the v0.2.0 docs,
// the shared installer and wrapping code (#190). The site's nav and footer sit
// outside <main>, so they may change. A deliberate change to a migratr page
// refreshes this fixture; anything else that moves a hash is a regression.
describe("/migratr/ pages hold their recorded main", () => {
  for (const [page, hash] of Object.entries(migratrBaseline)) {
    it(`/migratr/${page} matches its recorded main`, () => {
      const main = html(join("migratr", page)).match(/<main[\s\S]*<\/main>/)?.[0] ?? "";
      expect(createHash("sha256").update(main).digest("hex")).toBe(hash);
    });
  }
});

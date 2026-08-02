import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { htmlToMarkdown, collectDistBodies } from "../src/collect-dist";

const page = (body: string): string =>
  `<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;

describe("htmlToMarkdown", () => {
  // The defect this replaces: page source was used as the body, so component
  // wiring shipped as content. Rendered output has no component tags at all,
  // only their output, which is the whole point of reading dist.
  it("converts rendered component output, not component tags", () => {
    const md = htmlToMarkdown(
      page(`<main><h1>smugglr</h1><p>A SQLite sync engine.</p></main>`),
    );
    expect(md).toBe("# smugglr\n\nA SQLite sync engine.");
    expect(md).not.toMatch(/^<[A-Z]/m);
  });

  it("prefers article over main when both are present", () => {
    const md = htmlToMarkdown(
      page(`<main><p>chrome region</p><article><p>prose region</p></article></main>`),
    );
    expect(md).toBe("prose region");
  });

  // No body fallback by design: a page of nav is worse than an absent entry,
  // because it costs an agent context and answers nothing.
  it("returns undefined when neither landmark is present", () => {
    expect(htmlToMarkdown(page(`<div><p>orphaned</p></div>`))).toBeUndefined();
  });

  it("strips chrome that sits inside the landmark", () => {
    const md = htmlToMarkdown(
      page(`<main><nav><a href="/a">Nav</a></nav><p>real</p><footer>Footer</footer></main>`),
    );
    expect(md).toBe("real");
  });

  // Rafters wraps everything in Container/Grid divs. Descending through
  // unrecognised elements is what makes the walk find prose underneath them.
  it("descends through unrecognised wrapper elements", () => {
    const md = htmlToMarkdown(
      page(`<main><div class="container"><div class="grid"><h2>Deep</h2></div></div></main>`),
    );
    expect(md).toBe("## Deep");
  });

  it("converts tables to markdown, escaping pipes in cells", () => {
    const md = htmlToMarkdown(
      page(
        `<main><table><tr><th>Channel</th><th>Command</th></tr>` +
          `<tr><td>CLI</td><td>a | b</td></tr></table></main>`,
      ),
    );
    expect(md).toBe("| Channel | Command |\n| --- | --- |\n| CLI | a \\| b |");
  });

  it("keeps link hrefs, since a URL is the actionable part for an agent", () => {
    const md = htmlToMarkdown(page(`<main><p>See <a href="/docs/">the docs</a>.</p></main>`));
    expect(md).toBe("See [the docs](/docs/).");
  });

  it("fences pre blocks so JSX examples read as code, not as content", () => {
    const md = htmlToMarkdown(page(`<main><pre><code>&lt;Editor /&gt;</code></pre></main>`));
    expect(md).toBe("```\n<Editor />\n```");
  });

  it("renders both list kinds", () => {
    const md = htmlToMarkdown(
      page(`<main><ul><li>one</li><li>two</li></ul><ol><li>first</li></ol></main>`),
    );
    expect(md).toBe("- one\n- two\n\n1. first");
  });

  it("returns undefined for a landmark with no convertible content", () => {
    expect(htmlToMarkdown(page(`<main><nav><a href="/a">only nav</a></nav></main>`))).toBeUndefined();
  });
});

async function fixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "collect-dist-"));
  for (const [rel, html] of Object.entries(files)) {
    const full = join(root, rel);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, html, "utf-8");
  }
  return root;
}

describe("collectDistBodies", () => {
  it("keys bodies by route, matching collect-pages' route shape", async () => {
    const root = await fixture({
      "index.html": page(`<main><p>home</p></main>`),
      "docs/index.html": page(`<main><p>docs</p></main>`),
      "docs/cli/index.html": page(`<main><p>cli</p></main>`),
    });
    const bodies = await collectDistBodies({ distDir: root, warn: () => {} });
    expect([...bodies.keys()].sort()).toEqual(["/", "/docs/", "/docs/cli/"]);
    expect(bodies.get("/docs/cli/")).toBe("cli");
  });

  // The cross-site bug this exists to prevent. A server build writes
  // dist/client/, so walking dist yields /client/-prefixed routes that match
  // nothing in the source walk and every body is silently dropped.
  // gitpress.app is the live case; verifying only on a static site missed it.
  it("resolves the client subdirectory for server builds", async () => {
    const root = await fixture({
      "client/index.html": page(`<main><p>home</p></main>`),
      "server/entry.mjs": "export default {};",
    });
    const bodies = await collectDistBodies({ distDir: root, warn: () => {} });
    expect([...bodies.keys()]).toEqual(["/"]);
  });

  it("warns and omits a page with no landmark rather than emitting chrome", async () => {
    const root = await fixture({ "index.html": page(`<div><p>no landmark</p></div>`) });
    const warnings: string[] = [];
    const bodies = await collectDistBodies({ distDir: root, warn: (m) => warnings.push(m) });
    expect(bodies.size).toBe(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/no <article> or <main>/);
  });

  it("returns empty rather than throwing when the dist directory is absent", async () => {
    const bodies = await collectDistBodies({ distDir: "/nonexistent/dist", warn: () => {} });
    expect(bodies.size).toBe(0);
  });
});

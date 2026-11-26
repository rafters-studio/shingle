// shingle #213: the rules scripts/smugglr-docs.mjs copies the smugglr repo's docs by.
import { describe, expect, it } from "vitest";
import { isCopy, lead, page, published, splitTitle, target } from "../src/smugglr/docs-copy";

describe("which paths are published, and where they land", () => {
  it("publishes docs/*.md and examples/*/README.md, nothing deeper or else", () => {
    expect(published("docs/integer-keys.md")).toBe(true);
    expect(published("examples/hono-tab/README.md")).toBe(true);
    expect(published("docs/deep/x.md")).toBe(false);
    expect(published("README.md")).toBe(false);
    expect(published("examples/hono-tab/src/index.ts")).toBe(false);
    expect(published("crates/smugglr/README.md")).toBe(false);
  });

  it("lands a doc at <name>.md and an example at examples/<example>.md", () => {
    expect(target("docs/integer-keys.md")).toBe("integer-keys.md");
    expect(target("examples/hono-tab/README.md")).toBe("examples/hono-tab.md");
    expect(() => target("README.md")).toThrow("not a path the site publishes");
  });
});

describe("the title", () => {
  it("takes the first # heading as the title and keeps the rest", () => {
    expect(splitTitle("# Keys\n\nBody.\n## A\n", "docs/k.md")).toEqual({ title: "Keys", body: "Body.\n## A\n" });
  });

  it("does not take a # line inside a code block", () => {
    const text = "```sh\n# a comment\n```\n\nNo heading here.\n";
    expect(splitTitle(text, "docs/x.md")).toEqual({ title: "docs/x.md", body: text });
  });
});

describe("the description", () => {
  it("skips an introducing line, a Status line, code and tables", () => {
    const body = "Status: 0.6.1. About the doc.\n\nIntroduces this:\n\n```\ncode\n```\n\n| a |\n\nWhat it is.\n";
    expect(lead(body)).toBe("What it is.");
  });

  it("is plain text on one line, without inline code marks", () => {
    expect(lead("Keeps `smugglr mesh`\nin step.\n")).toBe("Keeps smugglr mesh in step.");
  });
});

describe("which pages are copies", () => {
  it("is a copy when its source is the smugglr repo, and a page written for the site is not", () => {
    expect(isCopy(page("docs/k.md", "# K\n\nText.\n", "v0.6.4"))).toBe(true);
    expect(isCopy('---\ntitle: "CLI reference"\nlayout: "../../layouts/Manual.astro"\n---\n')).toBe(false);
    expect(isCopy('---\nsource: "https://github.com/rafters-studio/other/blob/v1/x.md"\n---\n')).toBe(false);
  });
});

describe("the page", () => {
  it("names its source at the tag, the layout for its depth, and keeps the doc's text", () => {
    const doc = page("docs/k.md", "# K\n\nText.\n", "v0.6.4");
    expect(doc).toContain('source: "https://github.com/rafters-studio/smugglr/blob/v0.6.4/docs/k.md"');
    expect(doc).toContain('layout: "../../layouts/Manual.astro"');
    expect(doc.endsWith("Text.\n")).toBe(true);
    expect(page("examples/e/README.md", "# e\n\nT.\n", "v0.6.4")).toContain('layout: "../../../layouts/Manual.astro"');
  });
});

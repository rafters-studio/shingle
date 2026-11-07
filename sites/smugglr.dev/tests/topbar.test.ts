import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pages = ["index.html", "docs/index.html", "compare/index.html", "docs/get-started/index.html"];
const links = [
  "/migratr/",
  "/docs/",
  "/docs/cli/",
  "/compare/",
  "/compare/games/",
  "https://github.com/rafters-studio/smugglr",
];

describe.each(pages)("top bar on %s", (page) => {
  const html = readFileSync(join(process.cwd(), "dist", page), "utf8");

  it("renders one bar, with no fade-in bar", () => {
    // The manual's sidebar and its trigger sit at the same depth; the bar is the header.
    expect(html.match(/<header[^>]*z-depth-navigation/g)).toHaveLength(1);
    expect(html).not.toContain("site-topbar");
  });

  it("leads with migratr", () => {
    const header = html.match(/<header[^>]*z-depth-navigation[\s\S]*?<\/header>/)?.[0] ?? "";
    const hrefs = [...header.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => links.includes(h ?? ""));
    expect(hrefs[0]).toBe("/migratr/");
  });

  it("puts every link in the sheet and inline", () => {
    for (const href of links) {
      expect(html.split(`href="${href}"`).length - 1).toBeGreaterThanOrEqual(2);
    }
  });
});

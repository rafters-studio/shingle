import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fixture from "./fixtures/home-out.json";

const html = readFileSync(join(process.cwd(), "dist/index.html"), "utf8");

function decode(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function textOf(fragment: string): string {
  return decode(fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

const text = textOf(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ""));

describe("home page, built", () => {
  it("has the hero copy", () => {
    expect(text).toContain("SQLITE SYNC ENGINE · ONE RUST BINARY · MIT");
    expect(text).toContain("If you’re moving SQLite, smuggl it.");
    expect(text).toContain(
      "smugglr compares every row by its hash and moves only what changed. When it cannot be sure, it stops and names the rows.",
    );
    expect(text).toContain(
      "Or download the archive for your target from the v0.6.1 release on GitHub. No checksum file is published.",
    );
  });

  it("shows the install command", () => {
    expect(text).toContain(
      "$ cargo install --git https://github.com/rafters-studio/smugglr --tag v0.6.1 smugglr",
    );
  });

  it("orders hero, stage and band", () => {
    const hero = html.indexOf("<h1");
    const stage = html.indexOf("data-sync-stage");
    const band = html.indexOf('aria-label="Machine-readable summary"');
    expect(hero).toBeGreaterThan(-1);
    expect(stage).toBeGreaterThan(hero);
    expect(band).toBeGreaterThan(stage);
  });

  it("has the band's head and its eight sections", () => {
    expect(text).toContain("MACHINE-READABLE SUMMARY");
    expect(text).toContain("GET /llms.txt");
    const sections = [
      "01 SCOPE",
      "02 INSTALL",
      "03 PLACES",
      "04 EXIT CODES",
      "05 SYNC MODES",
      "06 THE RECORD",
      "07 MESH",
      "08 LIMITS",
    ];
    for (const section of sections) expect(text).toContain(`## ${section}`);
  });

  it("has the fixture's output blocks, byte for byte", () => {
    const blocks = [...html.matchAll(/<pre[^>]*data-out="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)];
    const found = Object.fromEntries(blocks.map((m) => [m[1], decode(m[2] ?? "")]));
    expect(found).toEqual(fixture);
  });

  it("is rafters: no hand styling on the page, no stylesheet but the stage's", () => {
    const source = readFileSync(join(process.cwd(), "src/pages/index.astro"), "utf8");
    const markup = source
      .slice(source.lastIndexOf("---"))
      // The Astro Table's documented surface: class strings on real table elements.
      .replace(/class=\{table\w+Classes\}/g, "");
    expect(markup).not.toMatch(/\bclass(:list)?=|\bstyle=|<style/);
    expect(markup).not.toMatch(/<(div|span|b|h1)[\s>]/);
    expect(readdirSync(join(process.cwd(), "src/styles"))).toEqual(["global.css"]);
  });

  it("has no React island and no old copy", () => {
    expect(html).not.toContain("astro-island");
    expect(html).not.toMatch(/<meta name="description"[^>]*S3 relay/);
  });
});

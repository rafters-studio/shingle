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
  it("has no hero", () => {
    expect(html).not.toContain("<h1");
    expect(text).not.toContain("If you’re moving SQLite");
  });

  it("shows the release binary's install line, not cargo", () => {
    const line = "curl -fsSL https://smugglr.dev/install | bash";
    expect(text).toContain(line);
    expect(html).toContain(`data-install="${line}"`);
    expect(text).toContain("Install smugglr v0.6.4");
    expect(text).not.toContain("cargo install");
  });

  it("links the release's five archives and claims no missing checksum", () => {
    const files = [
      "smugglr-aarch64-apple-darwin.tar.gz",
      "smugglr-x86_64-apple-darwin.tar.gz",
      "smugglr-x86_64-unknown-linux-gnu.tar.gz",
      "smugglr-aarch64-unknown-linux-gnu.tar.gz",
      "smugglr-x86_64-pc-windows-msvc.zip",
    ];
    for (const file of files) {
      expect(html).toContain(`href="https://github.com/rafters-studio/smugglr/releases/download/v0.6.4/${file}"`);
    }
    expect(html).toContain('href="https://github.com/rafters-studio/smugglr/releases/tag/v0.6.4"');
    expect(text).not.toMatch(/no checksum/i);
  });

  it("has a migratr section with its installer and a way to its docs", () => {
    const section = html.match(/<section[^>]*aria-label="migratr"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(section).toContain('data-install="curl -fsSL https://smugglr.dev/migratr/install | bash"');
    expect(section).toContain('href="/migratr/"');
    expect(section).toContain('href="https://github.com/rafters-studio/migratr/releases/tag/v0.3.0"');
    const migratr = html.indexOf('aria-label="migratr"');
    expect(migratr).toBeGreaterThan(html.indexOf('aria-label="Install"'));
    expect(migratr).toBeLessThan(html.indexOf('aria-label="Machine-readable summary"'));
  });

  it("tells no one to use op or 1Password", () => {
    expect(text).not.toMatch(/op run|1Password|--environment/);
    expect(text).toContain("CLOUDFLARE_ACCOUNT_ID=<account-id> CLOUDFLARE_API_TOKEN=<token>");
  });

  it("orders stage, install and band", () => {
    const stage = html.indexOf("data-sync-stage");
    const install = html.indexOf("data-install=");
    const band = html.indexOf('aria-label="Machine-readable summary"');
    expect(stage).toBeGreaterThan(-1);
    expect(install).toBeGreaterThan(stage);
    expect(band).toBeGreaterThan(install);
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
    // Content takes the designer's sizes: no type overrides on the page or its pieces.
    for (const file of ["src/pages/index.astro", "src/components/install.astro", "src/components/band-head.astro", "src/components/band-section.astro"]) {
      const body = readFileSync(join(process.cwd(), file), "utf8").split("---").slice(2).join("---");
      expect(body).not.toMatch(/<(H[1-6]|P|Lead|Muted|Code|CodeBlock|Button|Typography)\b[^>]*\b(size|weight|family|line|tracking)=/);
    }
    expect(readdirSync(join(process.cwd(), "src/styles"))).toEqual(["global.css"]);
  });

  it("renders the sync stage in rafters' dark scope whatever the preference, live and still", () => {
    const live = html.match(/<section[^>]*data-sync-stage[^>]*>/)?.[0] ?? "";
    expect(live).toMatch(/class="[^"]*\bdark\b/);
    const stills = [...html.matchAll(/<section[^>]*class="([^"]*ss-still[^"]*)"/g)].map((m) => m[1] ?? "");
    expect(stills).toHaveLength(1);
    expect(stills[0]).toMatch(/\bdark\b/);
    // No script and no stylesheet rule picks a theme for the stage from the viewer's preference.
    const source = readFileSync(join(process.cwd(), "src/components/sync-stage.astro"), "utf8");
    const behavior = readFileSync(join(process.cwd(), "src/components/sync-stage.behavior.ts"), "utf8");
    expect(source).not.toContain("prefers-color-scheme");
    expect(source).not.toContain(":not(.dark)");
    expect(behavior).not.toContain("prefers-color-scheme");
  });

  it("adds the dark scope to the stage and to nothing else", () => {
    const dark = [...html.matchAll(/<(\w+)[^>]*class="[^"]*\bdark\b[^"]*"/g)].map((m) => m[0]);
    // Outside the stage only the summary band and the footer were dark before, and still are.
    const outside = dark.filter((tag) => !/ss-stage/.test(tag));
    expect(outside).toHaveLength(2);
    expect(outside[0]).toContain("<section");
    expect(outside[1]).toContain("<footer");
  });

  it("has no React island and no old copy", () => {
    expect(html).not.toContain("astro-island");
    expect(html).not.toMatch(/<meta name="description"[^>]*S3 relay/);
  });
});

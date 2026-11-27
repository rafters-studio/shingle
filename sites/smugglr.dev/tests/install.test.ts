import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The home page's install section, "Run it, or build it in", checked against
 * the built page and against what the build read (.astro/install-data.json,
 * written by src/install/data.ts from the GitHub releases and crates.io).
 */
const root = process.cwd();
const html = readFileSync(join(root, "dist/index.html"), "utf8");
const data = JSON.parse(readFileSync(join(root, ".astro/install-data.json"), "utf8")) as {
  programs: Record<"smugglr" | "migratr", { tag: string; url: string }>;
  crates: { name: string; version: string; description: string; command: string }[];
};

function decode(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

const from = html.indexOf('aria-label="Install"');
const to = html.indexOf('aria-label="Machine-readable summary"');
const section = from === -1 || to === -1 ? "" : html.slice(from, to);
const text = decode(section.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

const unix = ["curl -fsSL https://smugglr.dev/install | bash", "curl -fsSL https://smugglr.dev/migratr/install | bash"];
const windows = ["irm https://smugglr.dev/install.ps1 | iex", "irm https://smugglr.dev/migratr/install.ps1 | iex"];
const crates = [
  "smugglr-sync",
  "migratr",
  "forgr",
];

describe("home install section", () => {
  it("is one section under one heading, Install", () => {
    expect(section).not.toBe("");
    expect(html.match(/aria-label="Install"/g)).toHaveLength(1);
    expect(section.match(/<h2[^>]*>/g)).toHaveLength(1);
  });

  it("has the tabs macOS and Linux, then Windows (PowerShell)", () => {
    const tabs = [...section.matchAll(/role="tab"[^>]*>\s*([^<]+?)\s*</g)].map((m) => m[1]);
    expect(tabs).toEqual(["macOS and Linux", "Windows (PowerShell)"]);
  });

  it("shows each installer whole, as text that wraps, with a Copy button that copies it", () => {
    const rows = [...section.matchAll(/data-install="([^"]*)"/g)].map((m) => decode(m[1] ?? ""));
    expect(rows).toEqual([...unix, ...windows]);
    for (const command of [...unix, ...windows]) expect(text).toContain(command);
    expect(section).not.toMatch(/<input/);
    expect(section.match(/>\s*Copy\s*</g)?.length).toBe(rows.length);
  });

  it("names each program with the tag the build read, and links its release for archives and checksums", () => {
    for (const name of ["smugglr", "migratr"] as const) {
      const tag = data.programs[name].tag;
      expect(tag).toMatch(/^v\d+\.\d+\.\d+/);
      expect(text).toContain(`${name} ${tag} · archives and checksums`);
    }
    expect(section).toContain('href="https://github.com/rafters-studio/smugglr/releases/latest"');
    expect(section).toContain('href="https://github.com/rafters-studio/migratr/releases/latest"');
  });

  it("has a card per product, smugglr, migratr, forgr, each with its crate, the version the build read, and its docs", () => {
    const cards = [...section.matchAll(/data-product="([^"]+)"/g)].map((m) => m[1]);
    expect(cards).toEqual(["smugglr", "migratr", "forgr"]);
    expect(data.crates.map((c) => c.name)).toEqual(crates);
    for (const c of data.crates) {
      expect(c.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(text).toContain(`${c.command} ${c.version}`);
    }
    for (const docs of ["/docs/", "/migratr/", "/forgr/"]) expect(section).toContain(`href="${docs}"`);
  });

  it("shows install once: the machine-readable summary repeats no installer (#217)", () => {
    const band = html.slice(html.indexOf('aria-label="Machine-readable summary"'));
    const bandText = decode(band.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    expect(bandText).not.toContain("INSTALL");
    for (const command of [...unix, ...windows]) expect(bandText).not.toContain(command);
  });

});

describe("installer redirects", () => {
  const lines = readFileSync(join(root, "dist/_redirects"), "utf8")
    .split("\n")
    .map((l) => l.trim().split(/\s+/).join(" "));

  it("send install.ps1 to each repo's main install.ps1, as install.sh is", () => {
    expect(lines).toContain("/install.ps1 https://raw.githubusercontent.com/rafters-studio/smugglr/main/install.ps1 302");
    expect(lines).toContain(
      "/migratr/install.ps1 https://raw.githubusercontent.com/rafters-studio/migratr/main/install.ps1 302",
    );
  });
});

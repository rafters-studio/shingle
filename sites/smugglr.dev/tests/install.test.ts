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
const to = html.indexOf('aria-label="migratr"');
const section = from === -1 || to === -1 ? "" : html.slice(from, to);
const text = decode(section.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
const commandValues = [...section.matchAll(/<input[^>]*value="([^"]*)"/g)].map((m) => decode(m[1] ?? ""));

const unix = ["curl -fsSL https://smugglr.dev/install | bash", "curl -fsSL https://smugglr.dev/migratr/install | bash"];
const windows = ["irm https://smugglr.dev/install.ps1 | iex", "irm https://smugglr.dev/migratr/install.ps1 | iex"];
const crates = [
  "smugglr-sync",
  "smugglr-mesh",
  "smugglr-multi",
  "smugglr-web",
  "smugglr-core",
  "migratr",
  "forgr",
];

describe("home install section", () => {
  it("is one section, in place of the old install stacks", () => {
    expect(section).not.toBe("");
    expect(html.match(/aria-label="Install"/g)).toHaveLength(1);
    expect(html).not.toContain("Or download v");
    expect(html).not.toContain("Install smugglr v");
  });

  it("has the command-line part, then the Rust program part, each heading in accent", () => {
    const cli = section.indexOf("Run it from the command line");
    const lib = section.indexOf("Build it into your Rust program");
    expect(cli).toBeGreaterThan(-1);
    expect(lib).toBeGreaterThan(cli);
    expect(section.match(/<h2[^>]*text-accent-foreground[^>]*>/g)).toHaveLength(2);
  });

  it("has the tabs macOS and Linux, then Windows", () => {
    const tabs = [...section.matchAll(/role="tab"[^>]*>\s*([^<]+?)\s*</g)].map((m) => m[1]);
    expect(tabs).toEqual(["macOS and Linux", "Windows"]);
  });

  it("holds every command exactly, in order", () => {
    expect(commandValues).toEqual([
      ...unix,
      ...windows,
      ...data.crates.map((c) => c.command),
    ]);
    expect(data.crates.map((c) => c.name)).toEqual(crates);
    expect(data.crates.at(-1)?.command).toBe("cargo add forgr --dev --features fake");
    for (const c of data.crates.slice(0, -1)) expect(c.command).toBe(`cargo add ${c.name}`);
  });

  it("gives each command row a Copy button and a command to copy", () => {
    const rows = [...section.matchAll(/data-copy-command="([^"]*)"/g)].map((m) => decode(m[1] ?? ""));
    expect(rows).toEqual(commandValues);
    expect(section.match(/data-part="label"[^>]*>Copy</g)).toHaveLength(commandValues.length);
  });

  it("shows each version as the build read it", () => {
    for (const name of ["smugglr", "migratr"] as const) {
      const tag = data.programs[name].tag;
      expect(tag).toMatch(/^v\d+\.\d+\.\d+/);
      expect(text).toContain(`${name} ${tag}`);
    }
    for (const c of data.crates) {
      expect(c.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(text).toContain(`${c.name} ${c.version}`);
    }
  });

  it("shows each crate's description as crates.io gave it", () => {
    for (const c of data.crates) {
      expect(c.description.length).toBeGreaterThan(0);
      expect(text).toContain(c.description);
    }
  });

  it("links each repo's latest release for archives and checksums", () => {
    expect(text).toContain("Archives and checksums:");
    expect(section).toContain('href="https://github.com/rafters-studio/smugglr/releases/latest"');
    expect(section).toContain('href="https://github.com/rafters-studio/migratr/releases/latest"');
  });

  it("lists the installers and the crates in the machine-readable summary", () => {
    const band = html.slice(html.indexOf('aria-label="Machine-readable summary"'));
    const bandText = decode(band.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    for (const command of [...unix, ...windows, ...data.crates.map((c) => c.command)]) {
      expect(bandText).toContain(command);
    }
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

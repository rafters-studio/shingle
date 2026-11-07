import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseVersion, migratrVersion } from "../src/migratr/version";

const root = process.cwd();
const dist = join(root, "dist");
const changelog = join(root, "src/migratr/CHANGELOG.md");
const top = migratrVersion(changelog);

const pages = ["", "cli/", "migrations/", "library/", "changelog/"];

describe("migratr pages", () => {
  it("reads the top version from the changelog copy", () => {
    expect(top).toMatch(/^\d+\.\d+\.\d+$/);
  });

  for (const page of pages) {
    it(`/migratr/${page} shows version ${top}`, () => {
      const html = readFileSync(join(dist, "migratr", page, "index.html"), "utf8");
      expect(html).toContain(top);
    });
  }

  it("installs migratr with its own binary line and release archives, not cargo", () => {
    const html = readFileSync(join(dist, "migratr/index.html"), "utf8");
    expect(html).toContain('data-install="curl -fsSL https://smugglr.dev/migratr/install | bash"');
    for (const file of [
      "migratr-macos-arm64.tar.gz",
      "migratr-macos-x64.tar.gz",
      "migratr-linux-x64.tar.gz",
      "migratr-windows-x64.zip",
    ]) {
      expect(html).toContain(`href="https://github.com/rafters-studio/migratr/releases/download/v0.2.0/${file}"`);
    }
    expect(html).toContain('href="https://github.com/rafters-studio/migratr/releases/tag/v0.2.0"');
    expect(html).not.toContain("cargo install migratr-cli");
  });

  it("changelog page renders the changelog text", () => {
    const html = readFileSync(join(dist, "migratr/changelog/index.html"), "utf8");
    expect(html).toContain("The first release.");
  });
});

describe("_redirects", () => {
  const redirects = readFileSync(join(dist, "_redirects"), "utf8");
  const target = "https://raw.githubusercontent.com/rafters-studio/migratr/main/install.sh";
  const lines = redirects.split("\n").map((l) => l.trim().split(/\s+/).join(" "));

  it("has the two migratr lines", () => {
    expect(lines).toContain(`/migratr/install ${target} 302`);
    expect(lines).toContain(`/migratr/install.sh ${target} 302`);
  });

  it("keeps the existing /install line", () => {
    expect(lines).toContain(
      "/install https://raw.githubusercontent.com/rafters-studio/smugglr/main/install.sh 302",
    );
  });
});

describe("llms.txt", () => {
  const llms = readFileSync(join(dist, "llms.txt"), "utf8");
  const full = readFileSync(join(dist, "llms-full.txt"), "utf8");
  for (const page of pages) {
    it(`lists /migratr/${page}`, () => {
      expect(llms).toContain(`https://smugglr.dev/migratr/${page}`);
      expect(full).toContain(`https://smugglr.dev/migratr/${page}`);
    });
  }
});

describe("version helper", () => {
  it("throws naming the file when there is no version heading", () => {
    const dir = mkdtempSync(join(tmpdir(), "migratr-"));
    const file = join(dir, "CHANGELOG.md");
    writeFileSync(file, "# Changelog\n\nNothing yet.\n");
    expect(() => migratrVersion(file)).toThrow(file);
    expect(() => parseVersion("# x", "CHANGELOG.md")).toThrow("CHANGELOG.md");
  });
});

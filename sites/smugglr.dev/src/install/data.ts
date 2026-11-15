import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * What the home page's install section shows, read when the site builds: each
 * program's latest GitHub release tag, and each crate's version and description
 * from the crates.io API. Nothing here is typed. A failed read throws, so the
 * build fails rather than shipping a stale or empty version.
 *
 * The values are also written to .astro/install-data.json, so the tests can
 * check the built page against what this build read.
 */
export interface Program {
  name: string;
  repo: string;
  /** The latest release's tag, as GitHub names it: v0.6.4. */
  tag: string;
  /** The release page. */
  url: string;
}

export interface Crate {
  name: string;
  version: string;
  description: string;
  command: string;
}

export interface InstallData {
  programs: Record<"smugglr" | "migratr", Program>;
  crates: Crate[];
}

/** The crates, in the order the section lists them, with the command that adds each. */
export const CRATES: { name: string; command: string }[] = [
  { name: "smugglr-sync", command: "cargo add smugglr-sync" },
  { name: "smugglr-mesh", command: "cargo add smugglr-mesh" },
  { name: "smugglr-multi", command: "cargo add smugglr-multi" },
  { name: "smugglr-web", command: "cargo add smugglr-web" },
  { name: "smugglr-core", command: "cargo add smugglr-core" },
  { name: "migratr", command: "cargo add migratr" },
  { name: "forgr", command: "cargo add forgr --dev --features fake" },
];

const USER_AGENT = "smugglr.dev site build (https://smugglr.dev)";

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers } });
  if (!response.ok) throw new Error(`install section: ${url} answered ${response.status}`);
  return response.json();
}

function field(value: unknown, key: string, url: string): string {
  const found = typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
  if (typeof found !== "string" || found.trim() === "") throw new Error(`install section: ${url} has no "${key}"`);
  return found.trim();
}

async function program(name: "smugglr" | "migratr"): Promise<Program> {
  const repo = `rafters-studio/${name}`;
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const token = process.env["GITHUB_TOKEN"];
  const release = await getJson(url, token ? { Authorization: `Bearer ${token}` } : {});
  return { name, repo, tag: field(release, "tag_name", url), url: `https://github.com/${repo}/releases/latest` };
}

async function crate(spec: { name: string; command: string }): Promise<Crate> {
  const url = `https://crates.io/api/v1/crates/${spec.name}`;
  const body = (await getJson(url)) as { crate?: unknown };
  return {
    name: spec.name,
    version: field(body.crate, "max_version", url),
    description: field(body.crate, "description", url),
    command: spec.command,
  };
}

let read: Promise<InstallData> | undefined;

export function installData(): Promise<InstallData> {
  read ??= (async () => {
    const [smugglr, migratr, ...crates] = await Promise.all([program("smugglr"), program("migratr"), ...CRATES.map(crate)]);
    if (smugglr === undefined || migratr === undefined) throw new Error("install section: no release read");
    const data: InstallData = { programs: { smugglr, migratr }, crates: crates as Crate[] };
    const file = resolve(process.cwd(), ".astro/install-data.json");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    return data;
  })();
  return read;
}

/** The installers, per platform. The commands are the site's, not read. */
export const INSTALLERS = {
  unix: {
    smugglr: "curl -fsSL https://smugglr.dev/install | bash",
    migratr: "curl -fsSL https://smugglr.dev/migratr/install | bash",
  },
  windows: {
    smugglr: "irm https://smugglr.dev/install.ps1 | iex",
    migratr: "irm https://smugglr.dev/migratr/install.ps1 | iex",
  },
} as const;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Build and test both run from the site root; import.meta.url is relocated into dist/ by the bundler.
export const CHANGELOG_PATH = resolve(process.cwd(), 'src/migratr/CHANGELOG.md');

const VERSION_HEADING = /^## (\d+\.\d+\.\d+)\s*$/m;

/**
 * The first `## X.Y.Z` heading of a changelog. Throws, naming the file, when
 * there is none: a /migratr page never ships without its version.
 */
export function parseVersion(changelog: string, file: string): string {
  const match = VERSION_HEADING.exec(changelog);
  const version = match?.[1];
  if (version === undefined) {
    throw new Error(`${file}: no "## X.Y.Z" version heading found`);
  }
  return version;
}

/** The current migratr release, read at build time from the changelog copy. */
export function migratrVersion(path: string = CHANGELOG_PATH): string {
  return parseVersion(readFileSync(path, 'utf8'), path);
}

export const version: string = migratrVersion();

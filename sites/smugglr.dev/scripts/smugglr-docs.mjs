#!/usr/bin/env node
// Copies the smugglr repo's own docs onto smugglr.dev, at the release tag the
// site names (src/smugglr/release.ts): every docs/*.md and every
// examples/*/README.md. Each lands as a page in src/pages/docs/ (an example in
// src/pages/docs/examples/), with frontmatter naming its source and tag; the
// text is the smugglr repo's, unchanged except that its first "# " heading
// becomes the page title. Run it on every release refresh; never edit the
// copies by hand. The rules are in src/smugglr/docs-copy.ts.
//
// Usage:  node scripts/smugglr-docs.mjs
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REPO, isCopy, page, published, target } from "../src/smugglr/docs-copy.ts";

const OUT = join(process.cwd(), "src/pages/docs");

const release = readFileSync(join(process.cwd(), "src/smugglr/release.ts"), "utf8");
const version = /const version = "(\d+\.\d+\.\d+)"/.exec(release)?.[1];
if (version === undefined) {
  throw new Error("src/smugglr/release.ts: no `const version = \"X.Y.Z\"` found");
}
const tag = `v${version}`;

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "smugglr.dev-docs" } });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return res;
}

const tree = await (await get(`https://api.github.com/repos/${REPO}/git/trees/${tag}?recursive=1`)).json();
if (tree.truncated) throw new Error(`${REPO} at ${tag}: the tree listing came back truncated`);
const wanted = tree.tree.map((entry) => entry.path).filter(published).sort();

// Every doc is fetched before anything on disk changes, so a failed fetch
// leaves the last refresh's pages as they were.
const fetched = [];
for (const path of wanted) {
  fetched.push({ path, text: await (await get(`https://raw.githubusercontent.com/${REPO}/${tag}/${path}`)).text() });
}

// The copies from the last refresh go, so a doc the repo dropped leaves the
// site too; a page written for the site is never a copy and stays.
for (const entry of readdirSync(OUT, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
  const file = join(entry.parentPath, entry.name);
  if (isCopy(readFileSync(file, "utf8"))) rmSync(file);
}
for (const { path, text } of fetched) {
  const file = join(OUT, target(path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(path, text, tag));
  console.log(`${path} -> src/pages/docs/${target(path)}`);
}
console.log(`${wanted.length} docs from ${REPO} at ${tag}`);

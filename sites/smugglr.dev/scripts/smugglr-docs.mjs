#!/usr/bin/env node
// Copies the smugglr repo's own docs onto smugglr.dev, at the release tag the
// site names (src/smugglr/release.ts): every docs/*.md and every
// examples/*/README.md. Each lands as a page in src/pages/docs/ (an example in
// src/pages/docs/examples/), with frontmatter naming its source and tag; the
// text is the smugglr repo's, unchanged except that its first "# " heading
// becomes the page title. Run it on every release refresh; never edit the
// copies by hand.
//
// Usage:  node scripts/smugglr-docs.mjs
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO = "rafters-studio/smugglr";
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
const wanted = tree.tree
  .map((entry) => entry.path)
  .filter((path) => /^docs\/[^/]+\.md$/.test(path) || /^examples\/[^/]+\/README\.md$/.test(path))
  .sort();

/** Where a source file lands, relative to src/pages/docs/. */
function target(path) {
  const doc = /^docs\/([^/]+)\.md$/.exec(path);
  if (doc) return `${doc[1]}.md`;
  const example = /^examples\/([^/]+)\/README\.md$/.exec(path);
  return `examples/${example[1]}.md`;
}

/**
 * The first paragraph after the title that says what the page is, as plain
 * text on one line: not a code block, a table, a heading, a line that only
 * introduces what follows (ending in ":"), or a "Status:" line about the doc.
 */
function lead(body) {
  const paragraph = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find(
      (p) =>
        p !== "" &&
        !p.startsWith("#") &&
        !p.startsWith("```") &&
        !p.startsWith("|") &&
        !p.startsWith("Status:") &&
        !p.endsWith(":"),
    );
  return (paragraph ?? "").replace(/\s+/g, " ");
}

const yaml = (value) => JSON.stringify(value);

// The copies from the last refresh go first, so a doc the repo dropped leaves
// the site too. Only files this script wrote carry a `source:` line.
for (const entry of readdirSync(OUT, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
  const file = join(entry.parentPath, entry.name);
  if (/^source: "https:\/\/github\.com\/rafters-studio\/smugglr\//m.test(readFileSync(file, "utf8"))) rmSync(file);
}
for (const path of wanted) {
  const text = await (await get(`https://raw.githubusercontent.com/${REPO}/${tag}/${path}`)).text();
  const heading = /^# (.+)\n/m.exec(text);
  const title = heading?.[1].trim() ?? path;
  const body = heading ? text.slice(heading.index + heading[0].length).replace(/^\n+/, "") : text;
  const file = join(OUT, target(path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    [
      "---",
      `layout: ${yaml(target(path).includes("/") ? "../../../layouts/Manual.astro" : "../../layouts/Manual.astro")}`,
      `title: ${yaml(title)}`,
      `description: ${yaml(lead(body))}`,
      `source: ${yaml(`https://github.com/${REPO}/blob/${tag}/${path}`)}`,
      `tag: ${yaml(tag)}`,
      "lead: false",
      "---",
      "",
      body,
    ].join("\n"),
  );
  console.log(`${path} -> src/pages/docs/${target(path)}`);
}
console.log(`${wanted.length} docs from ${REPO} at ${tag}`);

#!/usr/bin/env node
// Copies forgr's README onto smugglr.dev at the tag for forgr's version on
// crates.io, into src/forgr/README.md with frontmatter naming its source and
// tag. The text is forgr's, unchanged except that its first "# " heading
// becomes the page title. Run it when forgr releases; never edit the copy by hand.
//
// Usage:  node scripts/forgr-docs.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "rafters-studio/forgr";

/** The first "# " heading outside a code block is the title; the rest is the body. */
function splitTitle(text) {
  const lines = text.split("\n");
  let fenced = false;
  for (const [i, line] of lines.entries()) {
    if (line.startsWith("```")) fenced = !fenced;
    if (!fenced && line.startsWith("# ")) {
      return { title: line.slice(2).trim(), body: lines.slice(i + 1).join("\n").replace(/^\n+/, "") };
    }
  }
  return { title: "forgr", body: text };
}
const headers = { "user-agent": "smugglr.dev site build (https://smugglr.dev)" };

async function get(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return res;
}

const crate = await (await get("https://crates.io/api/v1/crates/forgr")).json();
const version = crate?.crate?.max_version;
if (typeof version !== "string") throw new Error("crates.io: forgr has no max_version");
const tag = `v${version}`;
const text = await (await get(`https://raw.githubusercontent.com/${REPO}/${tag}/README.md`)).text();
const { title, body } = splitTitle(text);
const out = join(process.cwd(), "src/forgr/README.md");
mkdirSync(join(process.cwd(), "src/forgr"), { recursive: true });
writeFileSync(
  out,
  [
    "---",
    `title: ${JSON.stringify(title)}`,
    `source: ${JSON.stringify(`https://github.com/${REPO}/blob/${tag}/README.md`)}`,
    `tag: ${JSON.stringify(tag)}`,
    "---",
    "",
    body,
  ].join("\n"),
);
console.log(`README.md -> src/forgr/README.md from ${REPO} at ${tag}`);

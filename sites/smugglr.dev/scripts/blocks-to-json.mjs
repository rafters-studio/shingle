// Turns the blocks capture-manual.sh wrote (one <name>.txt each) into the JSON
// the manual pages import. Usage: node scripts/blocks-to-json.mjs <blocks dir> <out.json>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, out] = process.argv.slice(2);
if (dir === undefined || out === undefined) {
  throw new Error("usage: blocks-to-json.mjs <blocks dir> <out.json>");
}
const blocks = {};
for (const file of readdirSync(dir).sort()) {
  if (!file.endsWith(".txt")) continue;
  blocks[file.slice(0, -4)] = readFileSync(join(dir, file), "utf8").replace(/\n+$/, "");
}
writeFileSync(out, `${JSON.stringify(blocks, null, 2)}\n`);

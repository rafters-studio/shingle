// The rules scripts/smugglr-docs.mjs copies the smugglr repo's docs by, kept
// apart from its network calls so each rule is tested on its own
// (tests/docs-copy.test.ts). Erasable TypeScript only: Node runs this file
// directly when the script imports it.

export const REPO = "rafters-studio/smugglr";

/** Whether a path in the smugglr tree is one the site publishes. */
export function published(path: string): boolean {
  return /^docs\/[^/]+\.md$/.test(path) || /^examples\/[^/]+\/README\.md$/.test(path);
}

/** Where a published path lands, relative to src/pages/docs/. */
export function target(path: string): string {
  const doc = /^docs\/([^/]+)\.md$/.exec(path);
  if (doc?.[1] !== undefined) return `${doc[1]}.md`;
  const example = /^examples\/([^/]+)\/README\.md$/.exec(path);
  if (example?.[1] !== undefined) return `examples/${example[1]}.md`;
  throw new Error(`${path}: not a path the site publishes`);
}

/**
 * The doc's title and the rest: its first "# " heading, outside any code
 * block, becomes the title; without one, the title is the path and the text
 * is kept whole.
 */
export function splitTitle(text: string, path: string): { title: string; body: string } {
  const lines = text.split("\n");
  let fenced = false;
  for (const [i, line] of lines.entries()) {
    if (line.startsWith("```")) fenced = !fenced;
    if (!fenced && line.startsWith("# ")) {
      const body = lines.slice(i + 1).join("\n").replace(/^\n+/, "");
      return { title: line.slice(2).trim(), body };
    }
  }
  return { title: path, body: text };
}

/**
 * The first paragraph that says what the page is, as plain text on one line:
 * not a code block, a table, a heading, a line that only introduces what
 * follows (ending in ":"), or a "Status:" line about the doc. Inline code
 * marks are dropped, since the description is shown as plain text.
 */
export function lead(body: string): string {
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
  return (paragraph ?? "").replace(/`/g, "").replace(/\s+/g, " ");
}

/** Whether a page in src/pages/docs/ is a copy this script wrote: its source is the smugglr repo. */
export function isCopy(page: string): boolean {
  return /^source: "https:\/\/github\.com\/rafters-studio\/smugglr\//m.test(page);
}

/** The page written for a published path: frontmatter naming its source and tag, then the doc's text. */
export function page(path: string, text: string, tag: string): string {
  const { title, body } = splitTitle(text, path);
  const layout = target(path).includes("/") ? "../../../layouts/Manual.astro" : "../../layouts/Manual.astro";
  return [
    "---",
    `layout: ${JSON.stringify(layout)}`,
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(lead(body))}`,
    `source: ${JSON.stringify(`https://github.com/${REPO}/blob/${tag}/${path}`)}`,
    `tag: ${JSON.stringify(tag)}`,
    "lead: false",
    "---",
    "",
    body,
  ].join("\n");
}

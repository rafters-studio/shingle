export type ManualSection = { num: string; id: string; title: string };
export type ManualPage = {
  route: string;
  num: string;
  label: string;
  sections: ManualSection[];
  /** For a page copied from the smugglr repo: its one-line description. */
  description?: string;
};

/** The manual pages written for the site. */
const written: ManualPage[] = [
  {
    route: "/docs/get-started/",
    num: "01",
    label: "Get started",
    sections: [
      { num: "01", id: "install", title: "Install" },
      { num: "02", id: "first-sync", title: "Your first sync" },
      { num: "03", id: "change", title: "After the first sync" },
      { num: "04", id: "record", title: "Read the record" },
      { num: "05", id: "both", title: "A row changed in both places" },
      { num: "06", id: "hosted", title: "A hosted place" },
      { num: "07", id: "large", title: "A large first sync" },
      { num: "08", id: "mesh", title: "A mesh of nodes" },
      { num: "09", id: "next", title: "Next" },
    ],
  },
  {
    route: "/docs/how-smugglr-decides/",
    num: "02",
    label: "How smugglr decides",
    sections: [
      { num: "01", id: "hash", title: "Every row has a hash" },
      { num: "02", id: "memory", title: "It remembers the last agreement" },
      { num: "03", id: "one-or-both", title: "Changed on one side, or on both" },
      { num: "04", id: "conditional", title: "Writes are conditional" },
      { num: "05", id: "read-back", title: "It reads back what it wrote" },
      { num: "06", id: "cut-off", title: "A run cut off part-way" },
      { num: "07", id: "first-sync", title: "The first sync" },
      { num: "08", id: "shapes", title: "Shapes before rows" },
      { num: "09", id: "ignored", title: "What it never touches" },
      { num: "10", id: "mesh", title: "How a change travels in a mesh" },
      { num: "11", id: "limits", title: "What it does not cover" },
    ],
  },
  {
    route: "/docs/cli/",
    num: "03",
    label: "CLI reference",
    sections: [
      { num: "01", id: "synopsis", title: "Synopsis" },
      { num: "02", id: "flags", title: "Flags" },
      { num: "03", id: "sync-modes", title: "Sync modes" },
      { num: "04", id: "places", title: "Places" },
      { num: "05", id: "stash", title: "Stash and retrieve" },
      { num: "06", id: "exec", title: "Exec" },
      { num: "07", id: "mesh", title: "Mesh" },
      { num: "08", id: "config", title: "Config" },
      { num: "09", id: "exit-codes", title: "Exit codes" },
      { num: "10", id: "record", title: "The record" },
      { num: "11", id: "not-built", title: "Not in 0.6.4" },
    ],
  },
];

/** A doc copied from the smugglr repo into src/pages/docs/ by scripts/smugglr-docs.mjs. */
export type RepoDoc = {
  frontmatter: { title: string; description: string; source: string; tag: string };
  getHeadings: () => { depth: number; slug: string; text: string }[];
};

const docs = import.meta.glob<RepoDoc>("../pages/docs/**/*.md", { eager: true });

const two = (n: number): string => String(n).padStart(2, "0");

/** A copied doc's route: docs/x.md is /docs/x/, docs/examples/x.md is /docs/examples/x/. */
export function repoDocRoute(file: string): string {
  return `/docs/${file.replace(/^\.\.\/pages\/docs\//, "").replace(/\.md$/, "")}/`;
}

/** The docs copied from the smugglr repo, after the written pages, docs before examples. */
export const repoDocs: { route: string; doc: RepoDoc }[] = Object.entries(docs)
  .filter(([, doc]) => doc.frontmatter.source?.startsWith("https://github.com/rafters-studio/smugglr/"))
  .map(([file, doc]) => ({ route: repoDocRoute(file), doc }))
  .sort(
    (a, b) =>
      Number(a.route.includes("/examples/")) - Number(b.route.includes("/examples/")) ||
      a.route.localeCompare(b.route),
  );

export const manualPages: ManualPage[] = [
  ...written,
  ...repoDocs.map(({ route, doc }, i) => ({
    route,
    num: two(written.length + i + 1),
    label: doc.frontmatter.title,
    description: doc.frontmatter.description,
    sections: doc
      .getHeadings()
      .filter((h) => h.depth === 2)
      .map((h, j) => ({ num: two(j + 1), id: h.slug, title: h.text })),
  })),
];

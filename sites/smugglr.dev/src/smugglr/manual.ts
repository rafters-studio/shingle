export type ManualSection = { num: string; id: string; title: string };
export type ManualPage = { route: string; num: string; label: string; sections: ManualSection[] };

export const manualPages: ManualPage[] = [
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
      { num: "06", id: "mesh", title: "Mesh" },
      { num: "07", id: "config", title: "Config" },
      { num: "08", id: "exit-codes", title: "Exit codes" },
      { num: "09", id: "record", title: "The record" },
      { num: "10", id: "not-built", title: "Not in 0.6.1" },
    ],
  },
];

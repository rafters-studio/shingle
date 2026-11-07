import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bindMigratrStage, stageFrame } from "../src/components/migratr-stage.behavior";
import runs from "../src/migratr/runs.json";

const root = process.cwd();
const html = readFileSync(join(root, "dist/migratr/index.html"), "utf8");

function decode(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

describe("/migratr/, built", () => {
  it("has the design's sections in order", () => {
    const marks = [
      'aria-label="migratr"',
      "data-migratr-stage",
      'aria-label="Every row carried across"',
      'aria-label="The ledger"',
      'aria-label="Foreign keys"',
      'aria-label="The way back"',
      'aria-label="Local first"',
      'aria-label="For agents"',
      'aria-label="migratr 0.2.0 runs"',
    ];
    const at = marks.map((m) => html.indexOf(m));
    for (const [i, pos] of at.entries()) expect(pos, marks[i]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("numbers the agent sections 01 to 10, in order", () => {
    const runsAt = html.indexOf('aria-label="migratr 0.2.0 runs"');
    const titles = [
      "install",
      "new, plan, up",
      "add_foreign_key",
      "drop_column, rebuilt as a family",
      "ledger and checksum",
      "restore",
      "down: exact inverses only",
      "--json and exit codes",
      "limits",
      "pages",
    ];
    let from = runsAt;
    for (const title of titles) {
      const pos = html.indexOf(title, from);
      expect(pos, title).toBeGreaterThan(from);
      from = pos;
    }
  });

  it("shows every captured run, byte for byte", () => {
    const blocks = [...html.matchAll(/<pre[^>]*data-out="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)];
    const found = Object.fromEntries(blocks.map((m) => [m[1], decode(m[2] ?? "")]));
    expect(found).toEqual(runs);
  });
});

describe("/migratr/ colours", () => {
  const files = [
    "src/pages/migratr/index.astro",
    "src/components/migratr-stage.astro",
    "src/components/migratr-stage.classes.ts",
    "src/components/migratr-stage.behavior.ts",
    "src/components/migratr-stage-table.astro",
    "src/components/ink.classes.ts",
    "src/components/spaced-section.classes.ts",
    "src/components/install-line.astro",
    "src/components/data-table.astro",
    "src/components/wrap-code.classes.ts",
  ];
  it.each(files)("%s uses semantic colours only", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).not.toMatch(/silver-true|honey|violet|neutral-\d|#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(|hsla?\(/);
  });
});

describe("migratr stage timeline", () => {
  it("is on the design's beat at each time", () => {
    const beats: [number, string][] = [
      [0, "PLAN"],
      [3500, "SNAPSHOT"],
      [7000, "BUILD"],
      [10400, "COPY"],
      [14800, "DROP"],
      [17400, "RENAME"],
      [20200, "RECORD"],
      [23200, "New shape."],
      [27200, "RESTORE"],
      [31000, "And"],
    ];
    for (const [t, beat] of beats) {
      const f = stageFrame(t);
      expect(f.close ? f.close[0] : f.verb, `at ${t} ms`).toBe(beat);
    }
  });

  it("carries every user and post across, and restore brings the handles back", () => {
    const done = stageFrame(23200);
    const rows = done.slots.flatMap((s) => (s.kind === "table" ? s.rows : []));
    expect(rows).toHaveLength(6);
    const back = stageFrame(31000);
    const users = back.slots[0];
    expect(users?.kind === "table" && users.cols).toEqual(["id", "name", "handle"]);
  });
});

describe("bindMigratrStage", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stub(reduced: boolean) {
    const observed = vi.fn();
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("reduced-motion") ? reduced : false,
        addEventListener() {},
        removeEventListener() {},
      }),
      setTimeout: vi.fn(() => 1),
      clearTimeout: vi.fn(),
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor() {
          observed();
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener() {},
      removeEventListener() {},
      createElement: () => ({ dataset: {}, append() {}, replaceChildren() {} }),
    });
    return observed;
  }

  it("does nothing under reduced motion", () => {
    const observed = stub(true);
    const root = { querySelectorAll: () => [] } as unknown as HTMLElement;
    bindMigratrStage(root)();
    expect(observed).not.toHaveBeenCalled();
  });

  it("watches visibility otherwise", () => {
    const observed = stub(false);
    const root = { querySelectorAll: () => [] } as unknown as HTMLElement;
    bindMigratrStage(root)();
    expect(observed).toHaveBeenCalledOnce();
  });
});

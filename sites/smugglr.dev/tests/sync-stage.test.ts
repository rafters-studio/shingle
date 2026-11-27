import { afterEach, describe, expect, it, vi } from "vitest";
import { bindSyncStage, createSyncStage } from "../src/components/sync-stage.behavior";

type Host = Parameters<typeof createSyncStage>[0];

const side = { x: 0, r: 100, y: 0, row: 40 };
const piece = { setText() {}, moveTo() {}, remove() {}, width: 10, height: 10 };
const host: Host = {
  geometry: () => ({ sides: [side, { ...side, x: 200, r: 300 }], mid: 150 }),
  packet: () => piece,
  flash: () => piece,
  flashCount: () => 0,
  clear() {},
  isNarrow: () => false,
  render() {},
};

function clockTo(stage: ReturnType<typeof createSyncStage>, from: number, to: number): void {
  for (let t = from; t < to; t = Math.min(t + 16, to)) stage.advance(Math.min(16, to - t));
}

describe("sync stage timeline", () => {
  it("is on the right verb at each beat", () => {
    const stage = createSyncStage(host);
    const beats: [number, string, string][] = [
      [0, "READ", "it."],
      [2200, "HASH", "it."],
      [4600, "SMUGGL", "it."],
      [6800, "HASH", "it."],
      [9000, "WRITE", "it."],
      [11000, "SMUGGL", "them."],
      [14600, "STOP", "it."],
      [20000, "HASH", "them."],
      [22300, "closing", ""],
    ];
    let now = 0;
    for (const [at, beat, thin] of beats) {
      clockTo(stage, now, at);
      now = at;
      expect(stage.model.verb.beat, `at ${at} ms`).toBe(beat);
      expect(stage.model.verb.thin, `at ${at} ms`).toBe(thin);
    }
  });

  it("settles the HASH beat into the word's own hash and the closing into its line", () => {
    const stage = createSyncStage(host);
    clockTo(stage, 0, 3900);
    expect(stage.model.verb.bold).toBe("b6716efe");
    clockTo(stage, 3900, 23800);
    expect(stage.model.verb.a).toBe("smugglr data is");
    expect(stage.model.verb.b).toBe("safe data.");
  });

  it("loops at 27 seconds", () => {
    const stage = createSyncStage(host);
    clockTo(stage, 0, 27100);
    expect(stage.model.verb.beat).toBe("READ");
    expect(stage.model.left.map((row) => row.key)).toContain("sku-0412");
  });

  it("keeps eight rows a side through the rush", () => {
    const stage = createSyncStage(host);
    clockTo(stage, 0, 19000);
    expect(stage.model.left).toHaveLength(8);
    expect(stage.model.right).toHaveLength(8);
  });
});

function stubBrowser(reduced: boolean) {
  const raf = vi.fn(() => 1);
  const cancel = vi.fn();
  const observed: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      matches: query.includes("reduced-motion") ? reduced : false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        observed.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "MutationObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("document", { documentElement: { getAttribute: () => null } });
  return { raf, cancel, observed };
}

function fakeElement(): Record<string, unknown> {
  return {
    style: {},
    classList: { toggle() {} },
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, height: 0 }),
    getAttribute: () => null,
    appendChild() {},
  };
}

describe("bindSyncStage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing under reduced motion", () => {
    const { raf, observed } = stubBrowser(true);
    const root = { querySelector: vi.fn(), classList: { toggle: vi.fn() } };
    bindSyncStage(root as unknown as HTMLElement);
    expect(raf).not.toHaveBeenCalled();
    expect(observed).toHaveLength(0);
    expect(root.querySelector).not.toHaveBeenCalled();
    expect(root.classList.toggle).not.toHaveBeenCalled();
  });

  it("starts when scrolled into view and stops when scrolled out", () => {
    const { raf, cancel, observed } = stubBrowser(false);
    bindSyncStage(fakeElement() as unknown as HTMLElement);
    expect(raf).not.toHaveBeenCalled();
    const report = observed[0];
    report?.([{ isIntersecting: true }]);
    expect(raf).toHaveBeenCalledTimes(1);
    report?.([{ isIntersecting: false }]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("never changes the stage's theme, under a light preference or any other", () => {
    stubBrowser(false); // prefers-color-scheme: dark does not match: a light preference
    const toggle = vi.fn();
    const add = vi.fn();
    const remove = vi.fn();
    const root = { ...fakeElement(), classList: { toggle, add, remove } };
    bindSyncStage(root as unknown as HTMLElement);
    expect(toggle).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { bindInstallCopy } from "../src/components/install-copy.behavior";

function stub(write: (text: string) => Promise<void>) {
  const label = { textContent: "Copy" };
  const listeners: (() => void)[] = [];
  const button = {
    querySelector: () => label,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    textContent: "Copy",
  };
  const input = { readOnly: false };
  const row = {
    dataset: { copyCommand: "curl -fsSL https://smugglr.dev/install | bash" } as Record<string, string>,
    querySelector: (selector: string) => (selector === "input" ? input : button),
  };
  vi.stubGlobal("navigator", { clipboard: { writeText: write } });
  bindInstallCopy({ querySelectorAll: () => [row] } as unknown as ParentNode);
  return { label, click: () => listeners[0]?.(), input };
}

describe("install copy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("writes exactly the row's command, reads Copied, then Copy again", async () => {
    vi.useFakeTimers();
    const write = vi.fn(() => Promise.resolve());
    const { label, click, input } = stub(write);
    expect(input.readOnly).toBe(true);
    click();
    expect(write).toHaveBeenCalledWith("curl -fsSL https://smugglr.dev/install | bash");
    await Promise.resolve();
    expect(label.textContent).toBe("Copied");
    vi.advanceTimersByTime(1600);
    expect(label.textContent).toBe("Copy");
  });

  it("leaves the label as Copy when the browser refuses the copy", async () => {
    vi.useFakeTimers();
    const { label, click } = stub(() => Promise.reject(new Error("denied")));
    click();
    await Promise.resolve();
    await Promise.resolve();
    expect(label.textContent).toBe("Copy");
    vi.advanceTimersByTime(1600);
    expect(label.textContent).toBe("Copy");
  });
});

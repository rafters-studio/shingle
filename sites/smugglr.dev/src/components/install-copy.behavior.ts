/**
 * Install copy: a static row with one behavior. The command sits in an input
 * the visitor can select and scroll; this makes it read-only (rafters' Astro
 * InputGroup has no readonly prop) and wires the Copy button, which writes
 * exactly the row's command to the clipboard and reads Copied for a moment.
 * Without script the command is still there to select by hand.
 */
const COPIED_MS = 1500;

export function bindInstallCopy(root: ParentNode = document): void {
  for (const row of root.querySelectorAll<HTMLElement>("[data-copy-command]")) {
    if (row.dataset["bound"] === "true") continue;
    row.dataset["bound"] = "true";
    const command = row.dataset["copyCommand"] ?? "";
    const input = row.querySelector<HTMLInputElement>("input");
    const button = row.querySelector<HTMLButtonElement>("button");
    if (input) input.readOnly = true;
    if (!button) continue;
    // Rafters' Button holds its text in a label part.
    const text = button.querySelector<HTMLElement>('[data-part="label"]') ?? button;
    const label = text.textContent ?? "Copy";
    let timer: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener("click", () => {
      // Copied only when the browser took the copy; a refusal leaves the label as Copy.
      navigator.clipboard.writeText(command).then(
        () => {
          text.textContent = "Copied";
          clearTimeout(timer);
          timer = setTimeout(() => {
            text.textContent = label;
          }, COPIED_MS);
        },
        () => {},
      );
    });
  }
}

/** The tab a visitor's machine calls for. */
export function platformTab(): "windows" | "unix" {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent ?? "").toLowerCase();
  return platform.includes("win") ? "windows" : "unix";
}

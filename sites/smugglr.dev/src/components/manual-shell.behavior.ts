/**
 * Gaps in rafters' Sidebar that the manual's nav meets at phone width, closed
 * from the page, not by editing the installed component:
 *
 * - the trigger carries no aria-expanded by design (one value cannot describe
 *   both viewports), so a screen reader cannot tell if the sheet is open;
 * - Escape closes the sheet only when focus is inside the panel, and opening it
 *   leaves focus on the trigger, which the sheet then covers.
 *
 * bindManualShell mirrors the open state onto the trigger for the viewport in
 * use, moves focus into the panel when the sheet opens (so its own Escape key
 * works) and back to the trigger when it closes.
 */
const WIDE = "(min-width: 768px)";

export function bindManualShell(root: HTMLElement): () => void {
  const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
  const panel = root.querySelector<HTMLElement>('[data-part="panel"]');
  if (trigger === null || panel === null) return () => {};
  const wide = window.matchMedia(WIDE);
  let wasOpen = panel.dataset["mobile"] === "open";

  const sync = (): void => {
    const open = wide.matches ? panel.dataset["state"] === "expanded" : panel.dataset["mobile"] === "open";
    trigger.setAttribute("aria-expanded", String(open));
    const mobileOpen = !wide.matches && panel.dataset["mobile"] === "open";
    if (mobileOpen && !wasOpen) panel.focus();
    if (!mobileOpen && wasOpen) trigger.focus();
    wasOpen = mobileOpen;
  };

  const observer = new MutationObserver(sync);
  observer.observe(panel, { attributes: true, attributeFilter: ["data-mobile", "data-state"] });
  wide.addEventListener("change", sync);
  sync();
  return () => {
    observer.disconnect();
    wide.removeEventListener("change", sync);
  };
}

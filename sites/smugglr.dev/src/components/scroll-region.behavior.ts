/**
 * Scroll region: a table wider than its column scrolls sideways inside its own
 * wrapper. A scrolling box nobody can focus is unreachable from a keyboard and
 * gives sighted readers no hint, so one that overflows is made a focusable,
 * named region and marked data-scrolls, which the site's stylesheet draws as an
 * edge shadow and a focus ring.
 */
export function bindScrollRegions(doc: Document = document): () => void {
  // Content under aria-hidden is decorative (the stages): it is never focusable, so it never scrolls.
  const regions = (): HTMLElement[] =>
    [
      ...doc.querySelectorAll<HTMLElement>('div:has(> table[data-part="root"])'),
      ...doc.querySelectorAll<HTMLElement>("table:not([data-part])"),
    ].filter((el) => el.closest('[aria-hidden="true"]') === null);

  const mark = (): void => {
    for (const el of regions()) {
      const overflows = el.scrollWidth > el.clientWidth;
      if (overflows) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "region");
        const caption = el.querySelector("caption")?.textContent?.trim();
        el.setAttribute("aria-label", caption ? `${caption}, scrolls sideways` : "Table, scrolls sideways");
        el.setAttribute("data-scrolls", "");
      } else {
        el.removeAttribute("tabindex");
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
        el.removeAttribute("data-scrolls");
      }
    }
  };

  mark();
  window.addEventListener("resize", mark);
  return () => window.removeEventListener("resize", mark);
}

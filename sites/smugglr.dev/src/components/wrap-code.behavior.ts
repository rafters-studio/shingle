/**
 * Wrap code: a static score. No state, no actions, no effects. Its contract is
 * that a long line wraps inside the block, at a space where it can and inside
 * a word where it must, so the block never scrolls sideways at any width.
 */
export const wrapCode = {
  name: "wrap-code",
  element: "pre",
  /** Rendered output and commands are shown byte for byte; only the line box wraps. */
  preservesText: true,
} as const;

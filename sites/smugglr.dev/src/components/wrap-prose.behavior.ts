/**
 * Wrap prose: a static score. No state, no actions, no effects. Its contract
 * is that a word too long for its line, most often an inline code span such as
 * a Rust path or a URL, breaks inside the word rather than widening the page.
 * Words that fit are never broken, and min-content sizing is untouched.
 */
export const wrapProse = {
  name: "wrap-prose",
  element: "div",
} as const;

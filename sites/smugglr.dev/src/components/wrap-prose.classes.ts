/**
 * Wrap prose view: overflow-wrap is inherited, so one class on the wrapper
 * reaches every paragraph and inline code span inside it.
 */
export const wrapProseClasses = {
  root: "wrap-break-word",
} as const;

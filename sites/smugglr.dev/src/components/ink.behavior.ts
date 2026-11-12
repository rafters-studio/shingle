/**
 * Ink: a static score. No state, no actions, no effects. Its contract is an
 * inline run of text set on a solid semantic ground: warning for a mark that
 * must be seen (a stray key, a checksum mismatch, the page's promise), inverse
 * for the closing word set in the page's own ink.
 */
export const INK_TONES = ["warning", "inverse"] as const;
export type InkTone = (typeof INK_TONES)[number];

export const ink = {
  name: "ink",
  element: "mark",
  tones: INK_TONES,
} as const;

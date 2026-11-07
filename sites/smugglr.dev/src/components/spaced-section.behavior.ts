/**
 * Spaced section: a static score. No state, no actions, no effects. Its
 * contract is spacing on the block axis only, from the spacing scale, with the
 * page's side gutter, so a section gets room above and below without taking
 * width from a phone. `dark` puts the section under rafters' own .dark scope.
 */
export const SPACED_SECTION_SPACES = ["8", "12", "16", "20", "24"] as const;
export type SpacedSectionSpace = (typeof SPACED_SECTION_SPACES)[number];

export const spacedSection = {
  name: "spaced-section",
  element: "section",
  spaces: SPACED_SECTION_SPACES,
} as const;

/**
 * Spaced section view: block-axis padding from the spacing scale, the side
 * gutter, and rafters' .dark scope when asked.
 */
import { classy } from "@/lib/primitives/classy";
import type { SpacedSectionSpace } from "./spaced-section.behavior";

const spaceClasses: Record<SpacedSectionSpace, string> = {
  "8": "py-8",
  "12": "py-12",
  "16": "py-16",
  "20": "py-20",
  "24": "py-24",
};

export function spacedSectionClasses(space: SpacedSectionSpace, dark: boolean): string {
  return classy("px-4", spaceClasses[space], dark && "dark bg-background text-foreground");
}

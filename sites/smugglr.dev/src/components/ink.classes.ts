/**
 * Ink view: a solid ground from rafters' semantic colours, never a scale.
 */
import type { InkTone } from "./ink.behavior";

const toneClasses: Record<InkTone, string> = {
  warning: "bg-warning text-warning-foreground",
  inverse: "bg-foreground text-background",
};

export function inkClasses(tone: InkTone): string {
  return `inline-block rounded-sm px-1 ${toneClasses[tone]}`;
}

/**
 * Wrap code view: rafters' own CodeBlock classes, plus the two that make its
 * lines wrap instead of scroll.
 */
import { typographyClasses } from "@/components/ui/typography.classes";
import { classy } from "@/lib/primitives/classy";

export const wrapCodeClasses = {
  root: classy(typographyClasses.codeblock, "whitespace-pre-wrap wrap-anywhere"),
} as const;

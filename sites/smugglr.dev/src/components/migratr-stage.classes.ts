/**
 * migratr stage view: class strings, no logic. Colour is semantic only:
 * warning for what arrives, highlight for the ledger's check, foreground and
 * background for the closing ink, border and muted for the frame. Tables take
 * rafters' own table classes; the verb takes rafters' typography classes.
 */
import {
  tableBodyClasses,
  tableCaptionClasses,
  tableCellClasses,
  tableHeadClasses,
  tableHeaderClasses,
  tableRootClasses,
  tableRowClasses,
  tableWrapperClasses,
} from "@/components/ui/table.classes";
import { resolveTypography, typographyClasses } from "@/components/ui/typography.classes";
import { classy } from "@/lib/primitives/classy";

type VerbSize = "5xl" | "7xl";

export const migratrStageClasses = {
  root: "mg-stage border-y border-border py-24 px-4",
  wrap: "mx-auto grid max-w-6xl grid-cols-1 gap-16",
  head: "grid min-h-96 grid-cols-1 content-start justify-items-center gap-6 text-center max-sm:min-h-120",
  cmd: classy(typographyClasses.muted, "font-mono wrap-anywhere"),
  verbLine: (size: VerbSize): string =>
    resolveTypography("h2", { size, weight: "black", align: "center", line: "none" }),
  closeLine: (size: VerbSize): string =>
    resolveTypography("h2", { size, weight: "thin", align: "center", line: "none" }),
  thin: "font-thin",
  ink: "inline-block bg-foreground px-2 font-black text-background",
  stmtBox: "w-full max-w-4xl min-w-0 text-start",
  stmt: classy(typographyClasses.codeblock, "whitespace-pre-wrap wrap-anywhere"),
  field: "grid grid-cols-1 gap-12 lg:grid-cols-3",
  pairs: "grid grid-cols-1 items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-2",
  slot: "min-w-0",
  side: "grid min-w-0 content-start gap-10",
  ghost:
    "mg-in-a flex min-h-48 items-center justify-center rounded-md border border-dashed border-border p-5 text-center font-mono text-muted-foreground wrap-anywhere",
  struck: "line-through",
  left: "text-muted-foreground line-through",
  arrive: "mg-arrive rounded-sm",
  check: "mg-check",
  snap: "mg-in-a grid min-w-0 gap-4 rounded-lg border border-dashed border-warning p-5",
  mono: "font-mono wrap-anywhere",
  muted: typographyClasses.muted,
  flipA: "mg-flip-a",
  flipB: "mg-flip-b",
  tableWrap: tableWrapperClasses,
  table: tableRootClasses,
  caption: tableCaptionClasses,
  thead: tableHeaderClasses,
  tbody: tableBodyClasses,
  tr: tableRowClasses,
  th: tableHeadClasses,
  td: tableCellClasses,
} as const;

/**
 * Sync stage view: class strings, no logic. The rules live in
 * sync-stage.astro, built from rafters tokens.
 */
export const syncStageClasses = {
  live: "ss-stage ss-live dark",
  still: "ss-stage ss-still dark",
  verb: "ss-verb",
  closing: "ss-closing",
  field: "ss-field",
  wire: "ss-wire",
  check: "ss-check",
  wide: "ss-wide",
  packet: "ss-packet",
  bar: "ss-packet bar",
  flash: "ss-flash",
  heldFlash: "ss-flash held",
} as const;

/**
 * migratr stage score: one migration, remove_handle_from_users on app.db, as a
 * 36-second loop. Each beat's statement is a line the published migratr 0.3.0
 * binary printed (plan, up, restore, status); the timeline is the accepted
 * design's (canvas VJupMmxDvGJQ4KqyEqf11S v13). `stageFrame(t)` is pure state
 * for a time, which the server renders as the still frame; `bindMigratrStage`
 * plays it only while the stage is on screen and never under
 * prefers-reduced-motion.
 */
import stage from "@/src/migratr/stage.json";
import { migratrStageClasses as c } from "./migratr-stage.classes";

interface StageEvent {
  t: number;
  verb?: string;
  thin?: string;
  cmd?: string;
  close?: string[];
  cap: string;
  stmt: string;
}

export interface Cell {
  v: string;
  cls: string;
}

export interface Row {
  sel: boolean;
  cells: Cell[];
}

export interface TableSlot {
  kind: "table";
  caption: string;
  cols: string[];
  rows: Row[];
  capCls: string;
}

export interface GhostSlot {
  kind: "ghost";
  text: string;
  cls: string;
}

export type Slot = TableSlot | GhostSlot;

export interface StageFrame {
  cmd: string;
  verb: string;
  thin: string;
  close: [string, string] | null;
  cap: string;
  stmt: string;
  stmtCls: string;
  slots: Slot[];
  snapOn: boolean;
  snapCls: string;
  snap: TableSlot;
  ledger: TableSlot;
}

const EVENTS: StageEvent[] = stage.events;
const USERS: string[][] = stage.users;
const POSTS: string[][] = stage.posts;
const LEDGER: string[][] = stage.ledger;
const USER_TIMES: number[] = stage.userTimes;
const POST_TIMES: number[] = stage.postTimes;

export const STAGE_LOOP: number = stage.loop;
/** The frame shown before the stage first plays, and whenever motion is still. */
export const STAGE_REST = 23200;
const COPY_FLASH = 600;
const WIDE = "(min-width: 1024px)";

export const STAGE_LABEL =
  "Animation of one migratr migration, remove_handle_from_users, on app.db. plan prints the statements. A snapshot of app.db is taken. New users and posts tables are built, rows are copied parents first, the old posts and then the old users are dropped, the new tables are renamed parent first, and the ledger row is recorded. Three users and three posts go in and come out. Then restore --yes puts the snapshot back, the handles return, and the migration is pending again.";

export const STAGE_STILL =
  "In order: plan, snapshot, build the new tables, copy the rows parents first, drop the old children before the old parent, rename parent first, record the ledger row. restore --yes puts the snapshot back.";

/** The snapshot's path as the captured run printed it (the SNAPSHOT beat's `latest snapshot:` line). */
export const SNAPSHOT_PATH = ((): string => {
  const line = (stage.events as StageEvent[]).find((e) => e.verb === "SNAPSHOT")?.stmt ?? "";
  const path = /snapshot: \.\/(\S+)$/.exec(line)?.[1];
  if (path === undefined) throw new Error("stage.json: the SNAPSHOT beat has no `latest snapshot:` path");
  return path;
})();
export const SNAPSHOT_NOTE = "A copy of app.db, taken before the step ran.";

function count(times: number[], t: number): number {
  let n = 0;
  for (const time of times) if (time <= t) n++;
  return n;
}

function cells(values: string[], cls?: (i: number) => string): Cell[] {
  return values.map((v, i) => ({ v, cls: cls ? cls(i) : "" }));
}

function table(caption: string, cols: string[], rows: Row[], capCls = ""): TableSlot {
  return { kind: "table", caption, cols, rows, capCls };
}

function ghost(text: string, cls = ""): GhostSlot {
  return { kind: "ghost", text, cls };
}

/** The stage at time t, in milliseconds into the loop. */
export function stageFrame(t: number): StageFrame {
  let k = 0;
  for (let i = 0; i < EVENTS.length; i++) if ((EVENTS[i]?.t ?? Infinity) <= t) k = i;
  const ev = EVENTS[k] as StageEvent;
  let cmd = "";
  for (let i = 0; i <= k; i++) cmd = EVENTS[i]?.cmd ?? cmd;
  const back = k >= 12;
  const uc = k >= 4 && !back ? count(USER_TIMES, t) : 0;
  const pc = k >= 5 && !back ? count(POST_TIMES, t) : 0;
  const copying = (times: number[], j: number): boolean => {
    const at = times[j] ?? Infinity;
    return !back && t >= at && t < at + COPY_FLASH;
  };

  const oldUsers = table(
    "users",
    ["id", "name", "handle"],
    USERS.map((r, j) => ({
      sel: copying(USER_TIMES, j),
      cells: cells(r, (i) => (i !== 2 ? "" : k === 12 ? c.arrive : j < uc ? c.left : "")),
    })),
    k === 12 ? c.arrive : "",
  );
  const oldPosts = table(
    "posts",
    ["id", "author_id", "title"],
    POSTS.map((r, j) => ({ sel: copying(POST_TIMES, j), cells: cells(r) })),
    k === 12 ? c.arrive : "",
  );
  const newUsers: Row[] = USERS.slice(0, k >= 8 ? 3 : uc).map((r) => ({
    sel: false,
    cells: cells([r[0] ?? "", r[1] ?? ""], () => (k < 8 ? c.arrive : "")),
  }));
  const newPosts: Row[] = POSTS.slice(0, k >= 9 ? 3 : pc).map((r) => ({
    sel: false,
    cells: cells(r, () => (k < 9 ? c.arrive : "")),
  }));

  let users: Slot;
  if (k < 7 || back) users = oldUsers;
  else if (k < 8) users = ghost('DROP TABLE "users"', c.struck);
  else users = table("users", ["id", "name"], newUsers, k === 8 ? c.arrive : "");

  let posts: Slot;
  if (k < 6 || back) posts = oldPosts;
  else if (k < 9) posts = ghost('DROP TABLE "posts"', c.struck);
  else posts = table("posts", ["id", "author_id", "title"], newPosts, k === 9 ? c.arrive : "");

  let rb1: Slot;
  if (k < 2 || back) rb1 = ghost("");
  else if (k < 8) rb1 = table("_migratr_rebuild", ["id", "name"], newUsers, c.arrive);
  else rb1 = ghost('ALTER TABLE "_migratr_rebuild" RENAME TO "users"');

  let rb2: Slot;
  if (k < 3 || back) rb2 = ghost("");
  else if (k < 9)
    rb2 = table("_migratr_rebuild_2", ["id", "author_id", "title"], newPosts, c.arrive);
  else rb2 = ghost('ALTER TABLE "_migratr_rebuild_2" RENAME TO "posts"');

  const ledgerRows: Row[] = LEDGER.slice(0, 3).map((r) => ({ sel: false, cells: cells(r) }));
  const last = LEDGER[3];
  if (k >= 10 && k <= 12 && last) {
    ledgerRows.push({ sel: k === 10, cells: cells(last, () => (k === 12 ? c.left : c.check)) });
  }

  return {
    cmd,
    verb: ev.verb ?? "",
    thin: ev.thin ?? "",
    close: ev.close ? [ev.close[0] ?? "", ev.close[1] ?? ""] : null,
    cap: ev.cap,
    stmt: ev.stmt,
    stmtCls: k % 2 ? c.flipA : c.flipB,
    slots: [users, rb1, posts, rb2],
    snapOn: k >= 1,
    snapCls: k === 12 ? c.arrive : "",
    snap: table(
      "users",
      ["id", "name", "handle"],
      USERS.map((r) => ({ sel: k === 12, cells: cells(r) })),
    ),
    ledger: table("_migratr_migrations", ["version", "name", "checksum"], ledgerRows),
  };
}

/** The moments the stage changes: each beat, each row copied, each copy flash ending. */
export const STAGE_TIMES: number[] = (() => {
  const all = new Set<number>();
  for (const ev of EVENTS) all.add(ev.t);
  for (const t of [...USER_TIMES, ...POST_TIMES]) {
    all.add(t);
    all.add(t + COPY_FLASH);
  }
  return [...all].sort((a, b) => a - b);
})();

export function nextTime(t: number): number {
  for (const time of STAGE_TIMES) if (time > t) return time;
  return STAGE_LOOP;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function tableNode(s: TableSlot): HTMLElement {
  const wrap = el("div", c.tableWrap);
  const tbl = el("table", c.table);
  const caption = el("caption", `${c.caption} ${s.capCls}`, s.caption);
  const thead = el("thead", c.thead);
  const headRow = el("tr", c.tr);
  for (const col of s.cols) headRow.append(el("th", c.th, col));
  thead.append(headRow);
  const tbody = el("tbody", c.tbody);
  for (const r of s.rows) {
    const tr = el("tr", c.tr);
    if (r.sel) tr.dataset.state = "selected";
    for (const cell of r.cells) tr.append(el("td", `${c.td} ${cell.cls}`, cell.v));
    tbody.append(tr);
  }
  tbl.append(caption, thead, tbody);
  wrap.append(tbl);
  return wrap;
}

function slotNode(s: Slot): HTMLElement {
  return s.kind === "table" ? tableNode(s) : el("div", `${c.ghost} ${s.cls}`, s.text);
}

function sideNode(f: StageFrame): HTMLElement {
  if (!f.snapOn) return el("div", c.ghost, ".migratr/snapshots/");
  const box = el("div", c.snap);
  box.append(el("div", `${c.mono} ${f.snapCls}`, SNAPSHOT_PATH), tableNode(f.snap));
  box.append(el("div", c.muted, SNAPSHOT_NOTE));
  return box;
}

export type VerbSize = "5xl" | "7xl";

/** Draws a frame into the stage's server-rendered parts. */
function drawFrame(parts: Map<string, HTMLElement>, f: StageFrame, size: VerbSize): void {
  const set = (name: string, text: string): void => {
    const node = parts.get(name);
    if (node && node.textContent !== text) node.textContent = text;
  };
  set("cmd", f.cmd);
  set("cap", f.cap);
  set("verb-bold", f.verb);
  set("verb-thin", f.thin);
  set("close-a", f.close?.[0] ?? "");
  set("close-b", f.close?.[1] ?? "");
  const verbLine = parts.get("verb-line");
  const closeLine = parts.get("close-line");
  if (verbLine) {
    verbLine.hidden = f.close !== null;
    verbLine.className = c.verbLine(size);
  }
  if (closeLine) {
    closeLine.hidden = f.close === null;
    closeLine.className = c.closeLine(size);
  }
  const stmt = parts.get("stmt");
  if (stmt && stmt.textContent !== f.stmt) {
    stmt.textContent = f.stmt;
    const box = parts.get("stmt-box");
    if (box) box.className = `${c.stmtBox} ${f.stmtCls}`;
  }
  const pairs = parts.get("pairs");
  if (pairs) {
    pairs.replaceChildren(
      ...f.slots.map((s) => {
        const slot = el("div", c.slot);
        slot.append(slotNode(s));
        return slot;
      }),
    );
  }
  parts.get("side")?.replaceChildren(sideNode(f));
  parts.get("ledger")?.replaceChildren(tableNode(f.ledger));
}

/**
 * Plays the stage in `root` while at least 15% of it is on screen and the tab
 * is visible. Under prefers-reduced-motion it does nothing: the server's still
 * frame stays. Returns a stop function.
 */
export function bindMigratrStage(root: HTMLElement): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const parts = new Map<string, HTMLElement>();
  for (const node of root.querySelectorAll<HTMLElement>("[data-mg]"))
    parts.set(node.dataset.mg ?? "", node);
  const wide = window.matchMedia(WIDE);
  let t = 0;
  let started = false;
  let timer = 0;
  let inView = false;

  const size = (): VerbSize => (wide.matches ? "7xl" : "5xl");
  const draw = (at: number): void => drawFrame(parts, stageFrame(at), size());
  const halt = (): void => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };
  const canPlay = (): boolean => inView && document.visibilityState !== "hidden";
  const play = (): void => {
    if (timer || !canPlay()) return;
    if (!started) {
      started = true;
      t = 0;
      draw(t);
    }
    const next = nextTime(t);
    timer = window.setTimeout(() => {
      timer = 0;
      t = next >= STAGE_LOOP ? 0 : next;
      draw(t);
      play();
    }, next - t);
  };
  const gate = (): void => (canPlay() ? play() : halt());

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[entries.length - 1]?.isIntersecting ?? false;
      gate();
    },
    { threshold: 0.15 },
  );
  io.observe(root);
  const onVisibility = (): void => gate();
  document.addEventListener("visibilitychange", onVisibility);
  const onWidth = (): void => draw(started ? t : STAGE_REST);
  wide.addEventListener("change", onWidth);
  onWidth();

  return () => {
    halt();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    wide.removeEventListener("change", onWidth);
  };
}

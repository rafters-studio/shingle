/**
 * Sync stage score: the 27-second timeline as state, and `bindSyncStage`, its
 * DOM client. The timeline touches the page only through a StageHost, so it
 * runs without one.
 *
 * Act one, 0-11 s: READ 0, HASH 2.2, SMUGGL 4.6 (one packet, checked mid-wire,
 * waits at the server), HASH 6.8 (the server's copy re-hashed, checked), WRITE
 * 9.0. Act two, 11-20 s: SMUGGL them. Reads every 620 ms falling to every 6 ms,
 * both ways; flights 950 ms to 420 ms; matched rows re-hash in place and stay.
 * 14.6-16.8 s: STOP it. sku-0099 changed on both sides; both copies meet at the
 * checkpoint and are held. Act three, 20-27 s: HASH them. (20.0), a read-back
 * ladder of checks (20.4), the closing line (22.3), hold, loop.
 */
import { syncStageClasses } from "./sync-stage.classes";

export const SS_COPY = {
  label:
    "Animation of a sync between two SQLite files, laptop/shop.db and server/shop.db. " +
    "One row is read, hashed, smuggled across and checked on the way, checked against the server’s own copy, " +
    "then written and read back with matching hashes. Then rows arrive on both sides and cross both ways, faster " +
    "and faster; rows that already match never move, and a row changed on both sides stops and is named. " +
    "It ends: smugglr data is safe data.",
  stillLabel: "How smugglr syncs a row, in five steps",
  caps: [
    "smugglr reads sku-0412 from laptop/shop.db.",
    "BLAKE3 of the word “hash” begins b6716efe. Every row is hashed the same way, and sku-0412 no longer matches the server.",
    "Only that row crosses, and its hash is checked on the wire. The other seven match, so they stay put.",
    "Before it writes, server/shop.db hashes its own copy: still the one it read.",
    "It writes the row, reads it back, and the hashes match.",
  ],
  still: [
    ["READ", "sku-0412"],
    ["HASH", "sku-0412  7d1c09ae ≠ 9a03b4f1"],
    ["SMUGGL", "sku-0412  7d1c09ae, checked on the wire"],
    ["HASH", "server: 9a03b4f1, unchanged"],
    ["WRITE", "sku-0412  7d1c09ae = 7d1c09ae"],
  ],
  stillThen:
    "Then every row, both ways at once. Rows that match stay where they are; changed rows cross, each hash checked on the wire. A row changed on both sides stops and is named.",
  closingA: "smugglr data is",
  closingB: "safe data.",
  keys: [
    "sku-0107",
    "sku-0233",
    "sku-0412",
    "ord-1180",
    "ord-1181",
    "usr-0042",
    "usr-0077",
    "inv-0905",
  ],
} as const;

const STOP_CAP =
  "sku-0099 changed on both sides. smugglr stops and names the row rather than guess.";
const READ_BACK_CAP = "Read back on both sides. Every hash matches.";
// First 8 hex of BLAKE3("hash"), computed with blake3 1.8.7, the crate smugglr uses.
const HASH_OF_HASH = "b6716efe";

const N = 8;
const LOOP = 27000;
const A2 = 11000;
const A2END = 20000;
const STOP0 = 14600;
const STOP1 = 16800;
const MAX_FRAME = 100;
const PHONE = "(max-width: 640px)";

type SideIndex = 0 | 1;

interface Row {
  key: string;
  hash: string;
  mark: string;
  sel: boolean;
}

interface Verb {
  /** The beat the timeline is on: READ, HASH, SMUGGL, WRITE, STOP, or closing. */
  beat: string;
  bold: string;
  thin: string;
  closing: boolean;
  a: string;
  b: string;
}

interface StageModel {
  left: Row[];
  right: Row[];
  verb: Verb;
  cap: string;
}

interface Side {
  x: number;
  r: number;
  y: number;
  row: number;
}

interface Geometry {
  sides: readonly [Side, Side];
  mid: number;
}

/** A packet or a flash on the wire. */
interface Piece {
  setText(text: string): void;
  moveTo(x: number, y: number): void;
  remove(): void;
  readonly width: number;
  readonly height: number;
}

interface StageHost {
  geometry(): Geometry;
  packet(text: string, bar: boolean): Piece;
  flash(x: number, y: number, held: boolean): Piece;
  flashCount(): number;
  clear(): void;
  isNarrow(): boolean;
  render(model: StageModel): void;
}

interface TextSlot {
  owner: object;
  name: string;
  set(text: string): void;
}

interface Scramble {
  slot: TextSlot;
  final: string;
  t0: number;
  dur: number;
  done: (() => void) | undefined;
  ok: (() => boolean) | undefined;
  swap: number;
}

interface Flight {
  piece: Piece;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
  hash: string | null;
  done: (() => void) | undefined;
  checked: boolean;
  linear: boolean;
}

function hex(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef".charAt(Math.floor(Math.random() * 16));
  return s;
}

function ease(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function rowY(side: Side, i: number): number {
  return side.y + Math.max(0, i) * side.row + side.row / 2;
}

function nextKey(): string {
  const kinds = ["sku", "ord", "usr", "inv"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)] ?? "sku";
  return `${kind}-${String(Math.floor(Math.random() * 10000) + 10000).slice(1)}`;
}

function rushProgress(t: number): number {
  const paused = Math.max(0, Math.min(t, STOP1) - STOP0);
  return Math.min(1, Math.max(0, (t - A2 - paused) / (A2END - A2 - (STOP1 - STOP0))));
}

/** The timeline. `advance` moves its clock; the host paints what it decides. */
export function createSyncStage(host: StageHost): { model: StageModel; advance(ms: number): void } {
  const model: StageModel = {
    left: [],
    right: [],
    verb: { beat: "READ", bold: "READ", thin: "it.", closing: false, a: "", b: "" },
    cap: "",
  };
  let now = 0;
  let queue: { t: number; fn: () => void }[] = [];
  let scrambles: Scramble[] = [];
  let flights: Flight[] = [];
  let word: { t0: number; swap: number } | null = null;
  let geoCache: Geometry | null = null;
  let dirty = false;
  let counts = { read: 0, cross: 0, match: 0 };
  let held: Piece[] = [];

  function at(t: number, fn: () => void): void {
    let i = queue.length;
    while (i > 0) {
      const before = queue[i - 1];
      if (!before || before.t <= t) break;
      i--;
    }
    queue.splice(i, 0, { t, fn });
  }
  function geo(): Geometry {
    geoCache ??= host.geometry();
    return geoCache;
  }
  function side(s: SideIndex): Row[] {
    return s === 0 ? model.left : model.right;
  }
  function makeRow(key: string, hash: string): Row {
    return { key, hash, mark: "", sel: false };
  }
  function insert(s: SideIndex, key: string, hash: string): Row {
    const rows = side(s);
    const row = makeRow(key, hash);
    rows.unshift(row);
    if (rows.length > N) rows.pop();
    dirty = true;
    return row;
  }
  function find(s: SideIndex, key: string): Row | undefined {
    return side(s).find((r) => r.key === key);
  }
  function there(s: SideIndex, row: Row): () => boolean {
    return () => side(s).includes(row);
  }
  function mark(row: Row, same: boolean): void {
    row.mark = same ? "=" : "≠";
    dirty = true;
  }
  function setVerb(beat: string, bold: string, thin: string): void {
    word = null;
    model.verb = { beat, bold, thin, closing: false, a: "", b: "" };
    dirty = true;
  }
  function setCap(text: string): void {
    model.cap = text;
    dirty = true;
  }
  function showCounts(): void {
    if (now >= A2END || (now >= STOP0 && now < STOP1)) return;
    setCap(
      `${counts.read}${counts.read === 1 ? " row" : " rows"} read and hashed. ${counts.cross} crossed. ${counts.match} already matched and stayed put.`,
    );
  }

  function hashSlot(row: Row): TextSlot {
    return {
      owner: row,
      name: "hash",
      set: (text) => {
        row.hash = text;
        dirty = true;
      },
    };
  }
  function pieceSlot(piece: Piece): TextSlot {
    return { owner: piece, name: "text", set: (text) => piece.setText(text) };
  }

  // Hex scramble of a text slot: characters settle left to right; until then they hiss.
  function scramble(
    slot: TextSlot,
    final: string,
    dur: number,
    done?: () => void,
    ok?: () => boolean,
  ): void {
    scrambles = scrambles.filter((s) => s.slot.owner !== slot.owner || s.slot.name !== slot.name);
    scrambles.push({ slot, final, t0: now, dur, done, ok, swap: -1e9 });
  }
  function stepScrambles(): void {
    for (const s of [...scrambles].reverse()) {
      if (!scrambles.includes(s)) continue;
      if (s.ok && !s.ok()) {
        scrambles = scrambles.filter((x) => x !== s);
        continue;
      }
      const p = (now - s.t0) / s.dur;
      if (p >= 1) {
        scrambles = scrambles.filter((x) => x !== s);
        s.slot.set(s.final);
        s.done?.();
      } else if (now - s.swap > 45) {
        s.swap = now;
        const k = Math.floor(p * s.final.length);
        let text = s.final.slice(0, k);
        for (let j = k; j < s.final.length; j++) text += s.final.charAt(j) === " " ? " " : hex(1);
        s.slot.set(text);
      }
    }
  }

  // The HASH beat: H, A, S, H land one at a time and each turns to hex as it
  // lands, then the word settles into its own hash.
  function hashWord(thin: string): void {
    setVerb("HASH", "", thin);
    word = { t0: now, swap: -1e9 };
  }
  function stepWord(): void {
    if (!word || now - word.swap < 50) return;
    word.swap = now;
    const e = now - word.t0;
    let text = "";
    if (e < 1000) {
      for (let i = 0; i < Math.min(4, Math.floor(e / 200) + 1); i++) {
        text += e - i * 200 > 140 ? hex(1) : "HASH".charAt(i);
      }
    } else {
      const k = Math.min(8, Math.floor(((e - 1000) / 600) * 8));
      text = HASH_OF_HASH.slice(0, k) + hex(8 - k);
      if (k === 8) word = null;
    }
    model.verb.bold = text;
    dirty = true;
  }

  // A hash at the checkpoint: it scrambles, settles and fades.
  function flash(y: number, hash: string, keep: boolean, dx = 0): Piece | null {
    if (!keep && host.flashCount() > 40) return null;
    const piece = host.flash(geo().mid + dx, y, keep);
    scramble(pieceSlot(piece), hash, keep ? 400 : 160);
    if (!keep) at(now + 700, () => piece.remove());
    return piece;
  }
  function fly(
    piece: Piece,
    from: readonly [number, number],
    to: readonly [number, number],
    dur: number,
    hash: string | null,
    bar: boolean,
    done?: () => void,
  ): void {
    piece.moveTo(from[0], from[1]);
    flights.push({
      piece,
      x0: from[0],
      y0: from[1],
      x1: to[0],
      y1: to[1],
      t0: now,
      dur,
      hash,
      done,
      checked: hash === null,
      linear: bar,
    });
  }
  function stepFlights(): void {
    for (const f of [...flights].reverse()) {
      // Bars run at an even speed so the stream fills the wire; labelled packets ease.
      const p = Math.min(1, (now - f.t0) / f.dur);
      const e = f.linear ? p : ease(p);
      const x = f.x0 + (f.x1 - f.x0) * e;
      const y = f.y0 + (f.y1 - f.y0) * e;
      f.piece.moveTo(x, y);
      if (
        !f.checked &&
        f.hash !== null &&
        Math.abs(x + f.piece.width / 2 - geo().mid) < Math.abs(f.x1 - f.x0) / 2 &&
        e >= 0.5
      ) {
        f.checked = true;
        flash(y + f.piece.height / 2, f.hash, false);
      }
      if (p >= 1) {
        flights = flights.filter((other) => other !== f);
        f.done?.();
      }
    }
  }

  function reset(): void {
    queue = [];
    scrambles = [];
    flights = [];
    held = [];
    word = null;
    now = 0;
    host.clear();
    counts = { read: 0, cross: 0, match: 0 };
    model.left = [];
    model.right = [];
    for (const key of SS_COPY.keys) {
      const hash = hex(8);
      model.left.push(makeRow(key, hash));
      model.right.push(makeRow(key, hash));
    }
    setVerb("READ", "READ", "it.");
    setCap(SS_COPY.caps[0]);
    script();
  }

  function script(): void {
    const L = model.left[2];
    const R = model.right[2];
    if (!L || !R) return;
    const oldH = R.hash;
    const newH = hex(8);
    let pk: Piece | null = null;
    let dockX = 0;
    let dockY = 0;
    at(300, () => {
      L.sel = true;
      dirty = true;
    });
    at(2200, () => {
      hashWord("it.");
      setCap(SS_COPY.caps[1]);
      scramble(hashSlot(L), newH, 1600, () => {
        mark(L, false);
        mark(R, false);
      });
    });
    at(4600, () => {
      setVerb("SMUGGL", "SMUGGL", "it.");
      setCap(SS_COPY.caps[2]);
      for (const rows of [model.left, model.right]) {
        rows.forEach((r, i) => {
          if (r !== L && r !== R) at(now + 80 + i * 50, () => mark(r, true));
        });
      }
      const g = geo();
      const [from, to] = g.sides;
      pk = host.packet("sku-0412", false);
      scramble(pieceSlot(pk), newH, 900);
      dockX = Math.max(to.x - pk.width - 4, g.mid);
      dockY = rowY(to, 2) - pk.height / 2;
      fly(pk, [from.r, rowY(from, 2) - pk.height / 2], [dockX, dockY], 1800, newH, false);
    });
    at(6800, () => {
      hashWord("it.");
      setCap(SS_COPY.caps[3]);
      L.sel = false;
      R.sel = true;
      dirty = true;
      scramble(hashSlot(R), oldH, 1500, () => {
        const to = geo().sides[1];
        flash(rowY(to, 2) + to.row, oldH, false);
      });
    });
    at(9000, () => {
      setVerb("WRITE", "WRITE", "it.");
      setCap(SS_COPY.caps[4]);
      if (!pk) return;
      const piece = pk;
      fly(piece, [dockX, dockY], [geo().sides[1].x, dockY], 450, null, false, () => {
        piece.remove();
        R.hash = newH;
        scramble(hashSlot(R), newH, 700, () => {
          mark(L, true);
          mark(R, true);
          flash(rowY(geo().sides[1], 2), newH, false);
        });
      });
    });
    at(10500, () => {
      R.sel = false;
      dirty = true;
    });
    at(A2, () => {
      setVerb("SMUGGL", "SMUGGL", "them.");
      showCounts();
      spawn(A2);
    });
    at(STOP0, conflict);
    at(STOP1, () => {
      setVerb("SMUGGL", "SMUGGL", "them.");
      showCounts();
      for (const piece of held) piece.remove();
      held = [];
      for (const r of [...model.left, ...model.right]) r.sel = false;
      dirty = true;
    });
    at(A2END, () => {
      hashWord("them.");
      setCap(READ_BACK_CAP);
    });
    at(20400, sweep);
    at(22300, () => {
      const verb: Verb = { beat: "closing", bold: "", thin: "", closing: true, a: "", b: "" };
      word = null;
      model.verb = verb;
      dirty = true;
      const slot = (name: "a" | "b"): TextSlot => ({
        owner: verb,
        name,
        set: (text) => {
          verb[name] = text;
          dirty = true;
        },
      });
      scramble(slot("a"), SS_COPY.closingA, 1400);
      scramble(slot("b"), SS_COPY.closingB, 1400);
    });
  }

  // One read per call. t is the read's own scheduled time, so several land in
  // one frame once the interval drops below a frame.
  function spawn(t: number): void {
    if (t >= A2END) return;
    if (t >= STOP0 && t < STOP1) {
      at(STOP1, () => spawn(STOP1));
      return;
    }
    const p = Math.pow(rushProgress(t), 0.7);
    const interval = 620 * Math.pow(6 / 620, p);
    const flight = 950 * Math.pow(420 / 950, p);
    const hashT = 420 * Math.pow(90 / 420, p);
    at(t + interval, () => spawn(t + interval));
    const s: SideIndex = Math.random() < 0.5 ? 0 : 1;
    const roll = Math.random();
    const hash = hex(8);
    let src: Row | undefined;
    let key: string;
    counts.read++;
    showCounts();
    if (roll >= 0.55) {
      const rows = side(s);
      src = rows[Math.floor(Math.random() * rows.length)];
      if (!src || src.sel) return;
      if (roll >= 0.8) {
        // Already matches: hashed where it sits, never moves.
        const row = src;
        counts.match++;
        scramble(hashSlot(row), row.hash, hashT, () => mark(row, true), there(s, row));
        return;
      }
      key = src.key;
      src.mark = "";
      dirty = true;
    } else {
      key = nextKey();
      src = insert(s, key, hash);
    }
    // The packet leaves even if newer rows have pushed its row out of view.
    const row = src;
    scramble(hashSlot(row), hash, hashT, () => launch(s, row, key, hash, p, flight, hashT));
  }
  function launch(
    s: SideIndex,
    src: Row,
    key: string,
    hash: string,
    p: number,
    flight: number,
    hashT: number,
  ): void {
    const ok = there(s, src);
    const other: SideIndex = s === 0 ? 1 : 0;
    const from = geo().sides[s];
    const to = geo().sides[other];
    const si = side(s).indexOf(src);
    const tgt = find(other, key);
    // Labelled while the eye can still read it: the key hashes as it leaves. A
    // bare bar once it is a stream.
    const bar = host.isNarrow() || p > 0.6;
    const pk = host.packet(bar ? "" : key, bar);
    if (!bar) scramble(pieceSlot(pk), hash, flight * 0.45);
    const y0 = rowY(from, si < 0 ? N - 1 : si) - pk.height / 2;
    const y1 = rowY(to, tgt ? side(other).indexOf(tgt) : 0) - pk.height / 2;
    const x0 = s === 0 ? from.r : from.x - pk.width;
    const x1 = s === 0 ? to.x - pk.width : to.r;
    fly(pk, [x0, y0], [x1, y1], flight, hash, bar, () => {
      pk.remove();
      const found = find(other, key);
      const dest = found ?? insert(other, key, hash);
      if (found) {
        found.hash = hash;
        found.mark = "";
      }
      counts.cross++;
      showCounts();
      scramble(
        hashSlot(dest),
        hash,
        hashT * 0.6,
        () => {
          mark(dest, true);
          if (ok()) mark(src, true);
        },
        there(other, dest),
      );
    });
  }
  function conflict(): void {
    setVerb("STOP", "STOP", "it.");
    setCap(STOP_CAP);
    const hl = hex(8);
    const hr = hex(8);
    const a = insert(0, "sku-0099", hl);
    const b = insert(1, "sku-0099", hr);
    a.sel = true;
    b.sel = true;
    mark(a, false);
    mark(b, false);
    // Both copies leave for the other side and meet at the checkpoint, where they are held.
    const g = geo();
    const [left, right] = g.sides;
    const y = rowY(left, 0);
    const narrow = host.isNarrow();
    const pa = host.packet(narrow ? "" : "sku-0099", narrow);
    const pb = host.packet(narrow ? "" : "sku-0099", narrow);
    const y0 = y - pa.height / 2;
    if (!narrow) {
      scramble(pieceSlot(pa), hl, 500);
      scramble(pieceSlot(pb), hr, 500);
    }
    fly(pa, [left.r, y0], [g.mid - pa.width - 6, y0], 700, null, narrow);
    fly(pb, [right.x - pb.width, y0], [g.mid + 6, y0], 700, null, narrow, () => {
      const piece = flash(y + left.row, `${hl} ≠ ${hr}`, true);
      if (piece) held.push(piece);
    });
    held.push(pa, pb);
  }
  function sweep(): void {
    const g = geo();
    model.left.forEach((r, i) => {
      at(now + i * 120, () => {
        if (!side(0).includes(r)) return;
        const twin = find(1, r.key);
        scramble(
          hashSlot(r),
          r.hash,
          240,
          () => {
            mark(r, true);
            if (twin) mark(twin, true);
          },
          there(0, r),
        );
        flash(rowY(g.sides[0], i), r.hash, false);
      });
    });
  }

  reset();
  dirty = false;
  host.render(model);

  return {
    model,
    advance(ms: number): void {
      now += ms;
      geoCache = null;
      for (let next = queue[0]; next && next.t <= now; next = queue[0]) {
        queue.shift();
        next.fn();
      }
      stepWord();
      stepScrambles();
      stepFlights();
      if (now >= LOOP) reset();
      if (dirty) {
        dirty = false;
        host.render(model);
      }
    },
  };
}

function setText(el: Element | null | undefined, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}

function renderRows(table: Element | undefined, rows: Row[]): void {
  if (!table) return;
  table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((tr, i) => {
    const row = rows[i];
    setText(tr.querySelector('[data-ss="key"]'), row?.key ?? "");
    setText(tr.querySelector('[data-ss="hash"]'), row?.hash ?? "");
    setText(tr.querySelector('[data-ss="match"]'), row?.mark ?? "");
    setText(tr.querySelector('[data-ss="narrow-mark"]'), row?.mark ? ` ${row.mark}` : "");
    if (row?.sel) {
      tr.setAttribute("aria-selected", "true");
      tr.dataset["state"] = "selected";
    } else {
      tr.removeAttribute("aria-selected");
      delete tr.dataset["state"];
    }
  });
}

/**
 * Starts the stage when it scrolls into view and stops it when it scrolls out.
 * Under reduced motion it does nothing: the still version is on the page, and
 * no animation frame is ever requested.
 */
export function bindSyncStage(root: HTMLElement): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const field = root.querySelector<HTMLElement>('[data-ss="field"]');
  const wire = root.querySelector<HTMLElement>('[data-ss="wire"]');
  const check = root.querySelector<HTMLElement>('[data-ss="check"]');
  if (!field || !wire || !check) return () => {};
  const verbEl = root.querySelector<HTMLElement>('[data-ss="verb"]');
  const closingEl = root.querySelector<HTMLElement>('[data-ss="closing"]');
  const boldEl = root.querySelector('[data-ss="bold"]');
  const thinEl = root.querySelector('[data-ss="thin"]');
  const closingA = root.querySelector('[data-ss="closing-a"]');
  const closingB = root.querySelector('[data-ss="closing-b"]');
  const capEl = root.querySelector('[data-ss="cap"]');
  const tables = [...field.querySelectorAll("table")];
  const narrow = window.matchMedia(PHONE);

  function makePiece(className: string, at?: { x: number; y: number }): Piece {
    const el = document.createElement("div");
    el.className = className;
    if (at) {
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
    }
    wire?.appendChild(el);
    return {
      setText: (text) => {
        el.textContent = text;
      },
      moveTo: (x, y) => {
        el.style.transform = `translate3d(${x}px,${y}px,0)`;
      },
      remove: () => el.remove(),
      get width() {
        return el.offsetWidth;
      },
      get height() {
        return el.offsetHeight;
      },
    };
  }
  function measureSide(body: HTMLTableSectionElement | undefined, fieldBox: DOMRect): Side {
    const box = body?.getBoundingClientRect();
    return {
      x: (box?.left ?? 0) - fieldBox.left,
      r: (box?.right ?? 0) - fieldBox.left,
      y: (box?.top ?? 0) - fieldBox.top,
      row: body?.rows[0]?.getBoundingClientRect().height ?? 40,
    };
  }

  const stage = createSyncStage({
    geometry() {
      const fieldBox = field.getBoundingClientRect();
      const bodies = field.querySelectorAll("tbody");
      const left = measureSide(bodies[0], fieldBox);
      const right = measureSide(bodies[1], fieldBox);
      const mid = (left.r + right.x) / 2;
      check.style.transform = `translate(${mid}px,${left.y}px)`;
      check.style.height = `${left.row * N}px`;
      return { sides: [left, right], mid };
    },
    packet(text, bar) {
      const piece = makePiece(bar ? syncStageClasses.bar : syncStageClasses.packet);
      piece.setText(text);
      return piece;
    },
    flash(x, y, held) {
      return makePiece(held ? syncStageClasses.heldFlash : syncStageClasses.flash, { x, y });
    },
    flashCount: () => wire.querySelectorAll(`.${syncStageClasses.flash}`).length,
    clear() {
      for (const el of wire.querySelectorAll(
        `.${syncStageClasses.packet}, .${syncStageClasses.flash}`,
      )) {
        el.remove();
      }
    },
    isNarrow: () => narrow.matches,
    render(model) {
      const { verb } = model;
      if (verbEl) verbEl.hidden = verb.closing;
      if (closingEl) closingEl.hidden = !verb.closing;
      setText(boldEl, verb.bold);
      setText(thinEl, verb.thin);
      setText(closingA, verb.a);
      setText(closingB, verb.b);
      setText(capEl, model.cap);
      renderRows(tables[0], model.left);
      renderRows(tables[1], model.right);
    },
  });

  let raf = 0;
  let last = 0;
  function frame(ts: number): void {
    stage.advance(last ? Math.min(ts - last, MAX_FRAME) : 16);
    last = ts;
    raf = requestAnimationFrame(frame);
  }
  function start(): void {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function stop(): void {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) start();
      else stop();
    },
    { threshold: 0.15 },
  );
  observer.observe(root);

  // Dark when the viewer is: prefers-color-scheme dark or data-theme="dark" on
  // the root, unless the root says light. The stage then takes rafters' .dark scope.
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const docRoot = document.documentElement;
  function applyTheme(): void {
    const theme = docRoot.getAttribute("data-theme");
    root.classList.toggle("dark", theme === "dark" || (theme !== "light" && scheme.matches));
  }
  applyTheme();
  scheme.addEventListener("change", applyTheme);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(docRoot, { attributes: true, attributeFilter: ["data-theme"] });

  return () => {
    stop();
    observer.disconnect();
    themeObserver.disconnect();
    scheme.removeEventListener("change", applyTheme);
  };
}

import {
  BAN_SIDES,
  type BanSide,
  type Board,
  type DragSource,
  type DropTarget,
  MAIN_SLOTS,
  PICK_SLOTS,
  SIDES,
  type Side,
  type Slot,
  type SlotRef,
  type SquadType,
  type StudentId,
} from "../types";

export interface RuleContext {
  /** Special rules: any student may go into any slot. Protection is still enforced. */
  releaseMode: boolean;
  /** Per side: true = 6 generic slots, false = 4 main + 2 support. */
  generic: Record<Side, boolean>;
  /** Free students may be picked multiple times, while banned, and into any slot. */
  freeIds: ReadonlySet<StudentId>;
  squadOf: (id: StudentId) => SquadType | undefined;
}

export type ViolationCode =
  | "protectedBanned"
  | "duplicateProtected"
  | "duplicateBan"
  | "duplicatePick"
  | "bannedPicked"
  | "mainOnly"
  | "supportOnly";

export interface Violation {
  code: ViolationCode;
  id: StudentId;
  slots: SlotRef[];
}

export const slotKey = (ref: SlotRef): string =>
  ref.zone === "protected" ? `protected:${ref.index}` : `${ref.zone}:${ref.side}:${ref.index}`;

export function emptyBoard(
  sideBans: number,
  sharedBans: number,
  protectedSlots: Slot[] = [null, null, null, null],
): Board {
  return {
    bans: {
      attacker: Array(sideBans).fill(null),
      shared: Array(sharedBans).fill(null),
      defender: Array(sideBans).fill(null),
    },
    picks: { attacker: Array(PICK_SLOTS).fill(null), defender: Array(PICK_SLOTS).fill(null) },
    protected: [...protectedSlots],
  };
}

export function cloneBoard(b: Board): Board {
  return {
    bans: { attacker: [...b.bans.attacker], shared: [...b.bans.shared], defender: [...b.bans.defender] },
    picks: { attacker: [...b.picks.attacker], defender: [...b.picks.defender] },
    protected: [...b.protected],
  };
}

export function getSlot(b: Board, ref: SlotRef): Slot {
  if (ref.zone === "ban") return b.bans[ref.side][ref.index] ?? null;
  if (ref.zone === "pick") return b.picks[ref.side][ref.index] ?? null;
  return b.protected[ref.index] ?? null;
}

/** Mutates `b`. Only call on a cloned board. */
function setSlot(b: Board, ref: SlotRef, value: Slot) {
  const arr = ref.zone === "ban" ? b.bans[ref.side] : ref.zone === "pick" ? b.picks[ref.side] : b.protected;
  if (ref.index < 0 || ref.index >= arr.length) return;
  arr[ref.index] = value;
}

export const sameSlot = (a: SlotRef, b: SlotRef) => slotKey(a) === slotKey(b);

export function slotSquadRequirement(ref: SlotRef, ctx: Pick<RuleContext, "generic">): SquadType | null {
  if (ref.zone !== "pick" || ctx.generic[ref.side]) return null;
  return ref.index < MAIN_SLOTS ? "Main" : "Support";
}

function collect(b: Board) {
  const bans = new Map<StudentId, SlotRef[]>();
  const picks = new Map<StudentId, SlotRef[]>();
  const prot = new Map<StudentId, SlotRef[]>();
  const add = (m: Map<StudentId, SlotRef[]>, id: Slot, ref: SlotRef) => {
    if (id == null) return;
    const list = m.get(id);
    if (list) list.push(ref);
    else m.set(id, [ref]);
  };
  for (const side of BAN_SIDES) {
    for (const [index, id] of b.bans[side].entries()) add(bans, id, { zone: "ban", side, index });
  }
  for (const side of SIDES) {
    for (const [index, id] of b.picks[side].entries()) add(picks, id, { zone: "pick", side, index });
  }
  for (const [index, id] of b.protected.entries()) add(prot, id, { zone: "protected", index });
  return { bans, picks, prot };
}

/** Every rule the board currently breaks. In release mode only always-enforced rules are reported. */
export function findViolations(b: Board, ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  const { bans, picks, prot } = collect(b);

  for (const [id, refs] of prot) {
    const banned = bans.get(id);
    if (banned) out.push({ code: "protectedBanned", id, slots: [...banned] });
    if (refs.length > 1) out.push({ code: "duplicateProtected", id, slots: refs.slice(1) });
  }
  if (ctx.releaseMode) return out;

  for (const [id, refs] of bans) {
    if (refs.length > 1) out.push({ code: "duplicateBan", id, slots: refs.slice(1) });
  }
  for (const [id, refs] of picks) {
    if (ctx.freeIds.has(id)) continue;
    if (refs.length > 1) out.push({ code: "duplicatePick", id, slots: refs.slice(1) });
    if (bans.has(id)) out.push({ code: "bannedPicked", id, slots: refs });
    const squad = ctx.squadOf(id);
    for (const ref of refs) {
      const need = slotSquadRequirement(ref, ctx);
      if (need && squad && need !== squad) {
        out.push({ code: need === "Main" ? "mainOnly" : "supportOnly", id, slots: [ref] });
      }
    }
  }
  return out;
}

const violationKey = (v: Violation) => `${v.code}|${v.id}|${v.slots.map(slotKey).join(",")}`;

export type DropResult =
  | { ok: true; board: Board; changed: boolean }
  | { ok: false; reason: ViolationCode; id: StudentId };

/**
 * Applies a drag-and-drop to the board. Semantics:
 * - pool → slot: place (replacing whatever was there).
 * - slot → same zone kind / ban ↔ pick: move, swapping with the target's occupant.
 * - protected → elsewhere, or elsewhere → protected: copy (protected slots act as a reserved list).
 * - slot → pool: clear the source slot.
 * The drop is rejected if it introduces any rule violation that wasn't already present.
 */
export function applyDrop(
  board: Board,
  source: DragSource,
  target: DropTarget,
  id: StudentId,
  ctx: RuleContext,
): DropResult {
  if (target.kind === "pool") {
    if (source.kind !== "slot") return { ok: true, board, changed: false };
    const next = cloneBoard(board);
    setSlot(next, source.slot, null);
    return { ok: true, board: next, changed: true };
  }

  const to = target.slot;
  if (source.kind === "slot" && sameSlot(source.slot, to)) return { ok: true, board, changed: false };

  const next = cloneBoard(board);
  const displaced = getSlot(board, to);
  setSlot(next, to, id);

  if (source.kind === "slot") {
    const fromProtected = source.slot.zone === "protected";
    const toProtected = to.zone === "protected";
    if (fromProtected === toProtected) setSlot(next, source.slot, displaced);
  }

  const before = new Set(findViolations(board, ctx).map(violationKey));
  const introduced = findViolations(next, ctx).find((v) => !before.has(violationKey(v)));
  if (introduced) return { ok: false, reason: introduced.code, id: introduced.id };
  return { ok: true, board: next, changed: true };
}

export function clearSlot(board: Board, ref: SlotRef): Board {
  const next = cloneBoard(board);
  setSlot(next, ref, null);
  return next;
}

export function resizeSlots(arr: Slot[], length: number): Slot[] {
  return length >= arr.length ? [...arr, ...Array(length - arr.length).fill(null)] : arr.slice(0, length);
}

export function resizeBans(b: Board, sideBans: number, sharedBans: number): Board {
  const next = cloneBoard(b);
  next.bans.attacker = resizeSlots(b.bans.attacker, sideBans);
  next.bans.defender = resizeSlots(b.bans.defender, sideBans);
  next.bans.shared = resizeSlots(b.bans.shared, sharedBans);
  return next;
}

/**
 * When a side switches from 6 generic slots to 4+2, move main students into the
 * main slots and supporters into the support slots where possible.
 */
export function arrangeForFourTwo(slots: Slot[], ctx: Pick<RuleContext, "squadOf" | "freeIds">): Slot[] {
  const filled = slots.filter((id): id is StudentId => id != null);
  const mains: StudentId[] = [];
  const supports: StudentId[] = [];
  const flexible: StudentId[] = [];
  for (const id of filled) {
    if (ctx.freeIds.has(id)) flexible.push(id);
    else if (ctx.squadOf(id) === "Support") supports.push(id);
    else mains.push(id);
  }
  const out: Slot[] = Array(PICK_SLOTS).fill(null);
  const overflow: StudentId[] = [];
  mains.forEach((id, i) => {
    if (i < MAIN_SLOTS) out[i] = id;
    else overflow.push(id);
  });
  supports.forEach((id, i) => {
    if (i < PICK_SLOTS - MAIN_SLOTS) out[MAIN_SLOTS + i] = id;
    else overflow.push(id);
  });
  // Free students fit anywhere; leftovers go into whatever is empty (and will be flagged as invalid).
  for (const id of [...flexible, ...overflow]) {
    const empty = out.indexOf(null);
    if (empty !== -1) out[empty] = id;
  }
  return out;
}

export interface BoardIndex {
  banned: Set<StudentId>;
  picked: Map<StudentId, Side[]>;
  protectedIds: Set<StudentId>;
}

export function indexBoard(b: Board): BoardIndex {
  const banned = new Set<StudentId>();
  for (const side of BAN_SIDES) for (const id of b.bans[side]) if (id != null) banned.add(id);
  const picked = new Map<StudentId, Side[]>();
  for (const side of SIDES) {
    for (const id of b.picks[side]) {
      if (id == null) continue;
      const sides = picked.get(id) ?? [];
      if (!sides.includes(side)) sides.push(side);
      picked.set(id, sides);
    }
  }
  const protectedIds = new Set(b.protected.filter((id): id is StudentId => id != null));
  return { banned, picked, protectedIds };
}

export const isBanSide = (s: string): s is BanSide => s === "attacker" || s === "defender" || s === "shared";

import { describe, expect, it } from "vitest";
import type { Board, DragSource, DropTarget, SlotRef, SquadType } from "../types";
import {
  applyDrop,
  arrangeForFourTwo,
  emptyBoard,
  findViolations,
  indexBoard,
  type RuleContext,
  resizeBans,
} from "./rules";

// IDs follow the SchaleDB convention: 1xxxx = main, 2xxxx = support.
const MAIN_A = 10000;
const MAIN_B = 10001;
const MAIN_C = 10002;
const SUP_A = 20000;
const FREE = 20027;

const ctx = (over: Partial<RuleContext> = {}): RuleContext => ({
  releaseMode: false,
  generic: { attacker: false, defender: false },
  freeIds: new Set([FREE]),
  squadOf: (id): SquadType => (id >= 20000 ? "Support" : "Main"),
  ...over,
});

const pool: DragSource = { kind: "pool" };
const from = (slot: SlotRef): DragSource => ({ kind: "slot", slot });
const to = (slot: SlotRef): DropTarget => ({ kind: "slot", slot });
const ban = (side: "attacker" | "defender" | "shared", index: number): SlotRef => ({
  zone: "ban",
  side,
  index,
});
const pick = (side: "attacker" | "defender", index: number): SlotRef => ({ zone: "pick", side, index });
const prot = (index: number): SlotRef => ({ zone: "protected", index });

function drop(board: Board, source: DragSource, target: DropTarget, id: number, c = ctx()) {
  const r = applyDrop(board, source, target, id, c);
  if (!r.ok) throw new Error(`unexpected rejection: ${r.reason}`);
  return r.board;
}

describe("applyDrop", () => {
  it("places a student from the pool into a ban slot", () => {
    const b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 2)), MAIN_A);
    expect(b.bans.attacker[2]).toBe(MAIN_A);
  });

  it("rejects banning the same student twice", () => {
    const b = drop(emptyBoard(5, 2), pool, to(ban("attacker", 0)), MAIN_A);
    const r = applyDrop(b, pool, to(ban("shared", 0)), MAIN_A, ctx());
    expect(r).toMatchObject({ ok: false, reason: "duplicateBan" });
  });

  it("moves a ban between slots instead of duplicating it", () => {
    let b = drop(emptyBoard(5, 2), pool, to(ban("attacker", 0)), MAIN_A);
    b = drop(b, pool, to(ban("defender", 0)), MAIN_B);
    b = drop(b, from(ban("attacker", 0)), to(ban("defender", 0)), MAIN_A);
    expect(b.bans.defender[0]).toBe(MAIN_A);
    expect(b.bans.attacker[0]).toBe(MAIN_B); // swapped
  });

  it("never allows banning a protected student, even with special rules", () => {
    const b = drop(emptyBoard(5, 0), pool, to(prot(0)), MAIN_A);
    for (const releaseMode of [false, true]) {
      const r = applyDrop(b, pool, to(ban("attacker", 0)), MAIN_A, ctx({ releaseMode }));
      expect(r).toMatchObject({ ok: false, reason: "protectedBanned" });
    }
  });

  it("rejects picking a banned student", () => {
    const b = drop(emptyBoard(5, 0), pool, to(ban("defender", 0)), MAIN_A);
    expect(applyDrop(b, pool, to(pick("attacker", 0)), MAIN_A, ctx())).toMatchObject({
      ok: false,
      reason: "bannedPicked",
    });
  });

  it("rejects picking the same student for both sides", () => {
    const b = drop(emptyBoard(5, 0), pool, to(pick("attacker", 0)), MAIN_A);
    expect(applyDrop(b, pool, to(pick("defender", 0)), MAIN_A, ctx())).toMatchObject({
      ok: false,
      reason: "duplicatePick",
    });
  });

  it("enforces main/support slots in 4+2 mode", () => {
    const b = emptyBoard(5, 0);
    expect(applyDrop(b, pool, to(pick("attacker", 4)), MAIN_A, ctx())).toMatchObject({
      ok: false,
      reason: "supportOnly",
    });
    expect(applyDrop(b, pool, to(pick("attacker", 0)), SUP_A, ctx())).toMatchObject({
      ok: false,
      reason: "mainOnly",
    });
  });

  it("allows any squad type in generic (6-slot) mode", () => {
    const c = ctx({ generic: { attacker: true, defender: false } });
    const b = drop(emptyBoard(5, 0), pool, to(pick("attacker", 0)), SUP_A, c);
    expect(b.picks.attacker[0]).toBe(SUP_A);
  });

  it("lets free students be picked twice, while banned, in any slot", () => {
    let b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 0)), FREE);
    b = drop(b, pool, to(pick("attacker", 0)), FREE);
    b = drop(b, pool, to(pick("defender", 1)), FREE);
    expect(b.picks.attacker[0]).toBe(FREE);
    expect(b.picks.defender[1]).toBe(FREE);
  });

  it("allows anything except banning protected students with special rules on", () => {
    const c = ctx({ releaseMode: true });
    let b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 0)), MAIN_A, c);
    b = drop(b, pool, to(pick("attacker", 5)), MAIN_A, c);
    b = drop(b, pool, to(pick("defender", 5)), MAIN_A, c);
    expect(
      findViolations(b, ctx())
        .map((v) => v.code)
        .sort(),
    ).toEqual(["bannedPicked", "duplicatePick", "supportOnly", "supportOnly"]);
  });

  it("swaps picks on the same side and validates both positions", () => {
    let b = drop(emptyBoard(5, 0), pool, to(pick("attacker", 0)), MAIN_A);
    b = drop(b, pool, to(pick("attacker", 1)), MAIN_B);
    b = drop(b, from(pick("attacker", 0)), to(pick("attacker", 1)), MAIN_A);
    expect(b.picks.attacker.slice(0, 2)).toEqual([MAIN_B, MAIN_A]);

    b = drop(b, pool, to(pick("attacker", 4)), SUP_A);
    // Swapping a main into a support slot (and vice versa) is illegal in 4+2 mode.
    expect(applyDrop(b, from(pick("attacker", 0)), to(pick("attacker", 4)), MAIN_B, ctx()).ok).toBe(false);
  });

  it("moves picks across sides, swapping occupants", () => {
    let b = drop(emptyBoard(5, 0), pool, to(pick("attacker", 0)), MAIN_A);
    b = drop(b, pool, to(pick("defender", 0)), MAIN_B);
    b = drop(b, from(pick("attacker", 0)), to(pick("defender", 0)), MAIN_A);
    expect(b.picks.defender[0]).toBe(MAIN_A);
    expect(b.picks.attacker[0]).toBe(MAIN_B);
  });

  it("copies out of protected slots rather than moving", () => {
    let b = drop(emptyBoard(5, 0), pool, to(prot(1)), MAIN_C);
    b = drop(b, from(prot(1)), to(pick("defender", 2)), MAIN_C);
    expect(b.protected[1]).toBe(MAIN_C);
    expect(b.picks.defender[2]).toBe(MAIN_C);
  });

  it("clears a slot when dropped back onto the pool", () => {
    const b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 3)), MAIN_A);
    const r = applyDrop(b, from(ban("attacker", 3)), { kind: "pool" }, MAIN_A, ctx());
    expect(r.ok && r.board.bans.attacker[3]).toBeNull();
  });

  it("is a no-op when dropping a slot onto itself", () => {
    const b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 3)), MAIN_A);
    const r = applyDrop(b, from(ban("attacker", 3)), to(ban("attacker", 3)), MAIN_A, ctx());
    expect(r).toMatchObject({ ok: true, changed: false });
  });
});

describe("helpers", () => {
  it("resizes ban arrays while keeping existing bans", () => {
    const b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 1)), MAIN_A);
    const r = resizeBans(b, 3, 4);
    expect(r.bans.attacker).toEqual([null, MAIN_A, null]);
    expect(r.bans.shared).toHaveLength(4);
  });

  it("rearranges generic picks into 4+2 shape", () => {
    const c = ctx();
    expect(arrangeForFourTwo([SUP_A, MAIN_A, null, MAIN_B, FREE, null], c)).toEqual([
      MAIN_A,
      MAIN_B,
      FREE,
      null,
      SUP_A,
      null,
    ]);
  });

  it("indexes banned, picked and protected students", () => {
    let b = drop(emptyBoard(5, 0), pool, to(ban("attacker", 0)), MAIN_A);
    b = drop(b, pool, to(pick("defender", 0)), MAIN_B);
    b = drop(b, pool, to(prot(0)), MAIN_C);
    const idx = indexBoard(b);
    expect(idx.banned.has(MAIN_A)).toBe(true);
    expect(idx.picked.get(MAIN_B)).toEqual(["defender"]);
    expect(idx.protectedIds.has(MAIN_C)).toBe(true);
  });
});

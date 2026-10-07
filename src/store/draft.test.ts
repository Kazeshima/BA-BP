import { beforeEach, describe, expect, it } from "vitest";
import type { DragSource, DropTarget, SlotRef } from "../types";
import { useDraft } from "./draft";
import { useSettings } from "./settings";
import { formatClock, useTimer } from "./timer";

const pool: DragSource = { kind: "pool" };
const to = (slot: SlotRef): DropTarget => ({ kind: "slot", slot });

beforeEach(() => {
  useSettings.setState({ sideBanCount: 5, sharedBanCount: 2, generic: { attacker: true, defender: false } });
  useDraft.setState({ past: [], future: [], releaseMode: false });
  useDraft.getState().setBanCounts(5, 2);
  useDraft.getState().fullReset();
  useDraft.setState({ past: [], future: [] });
});

describe("draft store", () => {
  it("undoes and redoes board changes", () => {
    const { drop } = useDraft.getState();
    drop(pool, to({ zone: "ban", side: "attacker", index: 0 }), 10000);
    drop(pool, to({ zone: "ban", side: "defender", index: 0 }), 10001);
    expect(useDraft.getState().undo()).toBe(true);
    expect(useDraft.getState().board.bans.defender[0]).toBeNull();
    expect(useDraft.getState().redo()).toBe(true);
    expect(useDraft.getState().board.bans.defender[0]).toBe(10001);
  });

  it("does not record rejected drops in history", () => {
    const { drop } = useDraft.getState();
    drop(pool, to({ zone: "ban", side: "attacker", index: 0 }), 10000);
    const r = drop(pool, to({ zone: "ban", side: "attacker", index: 1 }), 10000);
    expect(r.ok).toBe(false);
    expect(useDraft.getState().past).toHaveLength(1);
  });

  it("round reset keeps shared bans, full reset clears them and the scores", () => {
    const s = useDraft.getState();
    s.drop(pool, to({ zone: "ban", side: "shared", index: 1 }), 10000);
    s.drop(pool, to({ zone: "ban", side: "attacker", index: 0 }), 10001);
    s.drop(pool, to({ zone: "pick", side: "attacker", index: 0 }), 10002);
    s.setPlayer("attacker", { score: 2 });

    useDraft.getState().roundReset();
    let b = useDraft.getState().board;
    expect(b.bans.shared[1]).toBe(10000);
    expect(b.bans.attacker[0]).toBeNull();
    expect(b.picks.attacker[0]).toBeNull();
    expect(useDraft.getState().players.attacker.score).toBe(2);

    useDraft.getState().fullReset();
    b = useDraft.getState().board;
    expect(b.bans.shared[1]).toBeNull();
    expect(useDraft.getState().players.attacker.score).toBe(0);
  });

  it("keeps protected slots across resets", () => {
    useDraft.getState().protect(10005);
    useDraft.getState().fullReset();
    expect(useDraft.getState().board.protected[0]).toBe(10005);
  });

  it("refuses to leave special rules while the board is illegal", () => {
    const s = useDraft.getState();
    s.toggleRelease();
    s.drop(pool, to({ zone: "pick", side: "defender", index: 4 }), 10000); // main in a support slot
    expect(useDraft.getState().toggleRelease()?.code).toBe("supportOnly");
    expect(useDraft.getState().releaseMode).toBe(true);
    useDraft.getState().clear({ zone: "pick", side: "defender", index: 4 });
    expect(useDraft.getState().toggleRelease()).toBeNull();
    expect(useDraft.getState().releaseMode).toBe(false);
  });

  it("swaps names, avatars and scores between sides", () => {
    useDraft.getState().setPlayer("attacker", { name: "A", score: 3 });
    useDraft.getState().setPlayer("defender", { name: "B", score: 1 });
    useDraft.getState().swapSides();
    const { players } = useDraft.getState();
    expect(players.attacker).toMatchObject({ name: "B", score: 1 });
    expect(players.defender).toMatchObject({ name: "A", score: 3 });
  });
});

describe("timer", () => {
  it("formats the clock, rounding up partial seconds", () => {
    expect(formatClock(60_000)).toBe("01:00");
    expect(formatClock(9_001)).toBe("00:10");
    expect(formatClock(0)).toBe("00:00");
  });

  it("resumes from where it was paused instead of restarting", () => {
    useTimer.getState().setDuration(30);
    useTimer.getState().reset();
    useTimer.getState().start();
    useTimer.setState({ endsAt: Date.now() + 12_000 });
    useTimer.getState().pause();
    const paused = useTimer.getState().remainingMs;
    expect(paused).toBeGreaterThan(11_000);
    expect(paused).toBeLessThanOrEqual(12_000);
    useTimer.getState().start();
    const endsAt = useTimer.getState().endsAt ?? 0;
    expect(endsAt - Date.now()).toBeLessThanOrEqual(12_000);
  });
});

import { useMemo } from "react";
import { findViolations, indexBoard, slotKey } from "../lib/rules";
import { useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import { useSettings } from "../store/settings";

export function useBoardIndex() {
  const board = useDraft((s) => s.board);
  return useMemo(() => indexBoard(board), [board]);
}

/** Slots that break the normal rules (only possible with special rules on, or after settings changes). */
export function useInvalidSlots(): Set<string> {
  const board = useDraft((s) => s.board);
  const generic = useSettings((s) => s.generic);
  const freeIds = useSettings((s) => s.freeIds);
  const byId = useRoster((s) => s.byId);
  return useMemo(() => {
    const violations = findViolations(board, {
      releaseMode: false,
      generic,
      freeIds: new Set(freeIds),
      squadOf: (id) => byId.get(id)?.squadType,
    });
    return new Set(violations.flatMap((v) => v.slots.map(slotKey)));
  }, [board, generic, freeIds, byId]);
}

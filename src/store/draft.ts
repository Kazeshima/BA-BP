import { create } from "zustand";
import { persist } from "zustand/middleware";
import { readLegacyProtected } from "../lib/legacy";
import {
  applyDrop,
  arrangeForFourTwo,
  clearSlot,
  type DropResult,
  emptyBoard,
  findViolations,
  type RuleContext,
  resizeBans,
  type Violation,
} from "../lib/rules";
import type { Board, DragSource, DropTarget, Side, SlotRef, StudentId } from "../types";
import { useRoster } from "./roster";
import { clampSharedBans, clampSideBans, useSettings } from "./settings";

export interface Player {
  name: string;
  /** Data URL (downscaled) so it survives restarts. */
  avatar: string | null;
  score: number;
}

interface DraftState {
  board: Board;
  players: Record<Side, Player>;
  releaseMode: boolean;
  past: Board[];
  future: Board[];

  drop: (source: DragSource, target: DropTarget, id: StudentId) => DropResult;
  clear: (ref: SlotRef) => void;
  protect: (id: StudentId) => DropResult | null;
  unprotect: (id: StudentId) => void;
  setBanCounts: (side: number, shared: number) => void;
  setGeneric: (side: Side, generic: boolean) => boolean;
  /** Returns the blocking violation when special rules can't be turned off. */
  toggleRelease: () => Violation | null;
  roundReset: () => void;
  fullReset: () => void;
  undo: () => boolean;
  redo: () => boolean;

  setPlayer: (side: Side, patch: Partial<Player>) => void;
  swapSides: () => void;
}

const HISTORY_LIMIT = 100;

export function ruleContext(releaseMode: boolean = useDraft.getState().releaseMode): RuleContext {
  const settings = useSettings.getState();
  const { byId } = useRoster.getState();
  return {
    releaseMode,
    generic: settings.generic,
    freeIds: new Set(settings.freeIds),
    squadOf: (id) => byId.get(id)?.squadType ?? (id >= 20000 ? "Support" : "Main"),
  };
}

const defaultPlayers = (): Record<Side, Player> => ({
  attacker: { name: "", avatar: null, score: 0 },
  defender: { name: "", avatar: null, score: 0 },
});

function initialBoard(): Board {
  const { sideBanCount, sharedBanCount } = useSettings.getState();
  return emptyBoard(sideBanCount, sharedBanCount, readLegacyProtected());
}

export const useDraft = create<DraftState>()(
  persist(
    (set, get) => {
      /** Records the current board in history and replaces it. */
      const commit = (board: Board, extra: Partial<DraftState> = {}) =>
        set((s) => ({
          board,
          past: [...s.past, s.board].slice(-HISTORY_LIMIT),
          future: [],
          ...extra,
        }));

      return {
        board: initialBoard(),
        players: defaultPlayers(),
        releaseMode: false,
        past: [],
        future: [],

        drop: (source, target, id) => {
          const result = applyDrop(get().board, source, target, id, ruleContext());
          if (result.ok && result.changed) commit(result.board);
          return result;
        },

        clear: (ref) => commit(clearSlot(get().board, ref)),

        protect: (id) => {
          const { board } = get();
          if (board.protected.includes(id)) return null;
          const index = board.protected.indexOf(null);
          if (index === -1) return null;
          return get().drop({ kind: "pool" }, { kind: "slot", slot: { zone: "protected", index } }, id);
        },

        unprotect: (id) => {
          const { board } = get();
          if (!board.protected.includes(id)) return;
          commit({ ...board, protected: board.protected.map((p) => (p === id ? null : p)) });
        },

        setBanCounts: (side, shared) => {
          const sideCount = clampSideBans(side);
          const sharedCount = clampSharedBans(shared);
          useSettings.setState({ sideBanCount: sideCount, sharedBanCount: sharedCount });
          commit(resizeBans(get().board, sideCount, sharedCount));
        },

        setGeneric: (side, generic) => {
          const settings = useSettings.getState();
          useSettings.setState({ generic: { ...settings.generic, [side]: generic } });
          if (generic) return false;
          const { board } = get();
          const arranged = arrangeForFourTwo(board.picks[side], ruleContext());
          const changed = arranged.some((id, i) => id !== board.picks[side][i]);
          if (changed) commit({ ...board, picks: { ...board.picks, [side]: arranged } });
          return changed;
        },

        toggleRelease: () => {
          if (!get().releaseMode) {
            set({ releaseMode: true });
            return null;
          }
          const blocking = findViolations(get().board, ruleContext(false))[0];
          if (blocking) return blocking;
          set({ releaseMode: false });
          return null;
        },

        roundReset: () => {
          const { board } = get();
          commit(
            {
              ...emptyBoard(board.bans.attacker.length, 0, board.protected),
              bans: {
                attacker: board.bans.attacker.map(() => null),
                defender: board.bans.defender.map(() => null),
                shared: [...board.bans.shared],
              },
            },
            { releaseMode: false },
          );
        },

        fullReset: () => {
          const { board, players } = get();
          commit(emptyBoard(board.bans.attacker.length, board.bans.shared.length, board.protected), {
            releaseMode: false,
            players: {
              attacker: { ...players.attacker, score: 0 },
              defender: { ...players.defender, score: 0 },
            },
          });
        },

        undo: () => {
          const { past, board, future } = get();
          const prev = past.at(-1);
          if (!prev) return false;
          set({ board: prev, past: past.slice(0, -1), future: [board, ...future].slice(0, HISTORY_LIMIT) });
          return true;
        },

        redo: () => {
          const { past, board, future } = get();
          const next = future[0];
          if (!next) return false;
          set({ board: next, past: [...past, board].slice(-HISTORY_LIMIT), future: future.slice(1) });
          return true;
        },

        setPlayer: (side, patch) =>
          set((s) => ({ players: { ...s.players, [side]: { ...s.players[side], ...patch } } })),

        swapSides: () =>
          set((s) => ({ players: { attacker: s.players.defender, defender: s.players.attacker } })),
      };
    },
    {
      name: "ba-draft:match",
      version: 1,
      partialize: (s) => ({ board: s.board, players: s.players, releaseMode: s.releaseMode }),
      // Ban counts live in settings; keep the persisted board in sync with them.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<DraftState>) };
        const { sideBanCount, sharedBanCount } = useSettings.getState();
        merged.board = resizeBans(merged.board, sideBanCount, sharedBanCount);
        return merged;
      },
    },
  ),
);

import { create } from "zustand";
import { fetchStudents, type NameLang, readCachedRoster, writeCachedRoster } from "../lib/schaledb";
import type { Student, StudentId } from "../types";

type Status = "idle" | "loading" | "ready" | "error";

interface RosterState {
  lang: NameLang | null;
  students: Student[];
  byId: Map<StudentId, Student>;
  status: Status;
  /** True when showing cached data because the latest fetch failed. */
  stale: boolean;
  error: string | null;
  updatedAt: number | null;
  load: (lang: NameLang, opts?: { force?: boolean }) => Promise<void>;
}

const index = (students: Student[]) => new Map(students.map((s) => [s.id, s]));

let controller: AbortController | null = null;

export const useRoster = create<RosterState>()((set, get) => ({
  lang: null,
  students: [],
  byId: new Map(),
  status: "idle",
  stale: false,
  error: null,
  updatedAt: null,

  // Stale-while-revalidate: show the cached roster instantly, then refresh from SchaleDB.
  load: async (lang, opts = {}) => {
    if (get().lang === lang && get().status === "ready" && !opts.force) return;
    controller?.abort();
    const ctrl = new AbortController();
    controller = ctrl;

    const cached = readCachedRoster(lang);
    if (cached) {
      set({
        lang,
        students: cached.students,
        byId: index(cached.students),
        status: "ready",
        updatedAt: cached.savedAt,
        error: null,
      });
    } else if (get().status !== "ready") {
      // Nothing to show yet. (When switching language, keep showing the old names until the new ones arrive.)
      set({ lang, status: "loading", error: null });
    }

    try {
      const students = await fetchStudents(lang, ctrl.signal);
      if (ctrl.signal.aborted) return;
      writeCachedRoster(lang, students);
      set({
        lang,
        students,
        byId: index(students),
        status: "ready",
        stale: false,
        error: null,
        updatedAt: Date.now(),
      });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const message = e instanceof Error ? e.message : String(e);
      if (get().status === "ready") set({ stale: true, error: message });
      else set({ status: "error", error: message });
    }
  },
}));

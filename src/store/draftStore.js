import { create } from "zustand";

const MAIN_PICK_SLOTS = 4;
const SUP_PICK_SLOTS  = 2;
const GENERIC_SLOTS   = 6;

// ── localStorage ──────────────────────────────────────────────
const LS_ARCHIVE_KEY   = "ba_draft_archived_ids";
const LS_LANG_KEY      = "ba_draft_language";
const LS_SIDE_BANS     = "ba_draft_side_ban_count";
const LS_SHARED_BANS   = "ba_draft_shared_ban_count";
const LS_FREE_IDS      = "ba_draft_free_ids";          // special free-duplicate students
const LS_PROTECTED_KEY = "ba_draft_protected_slots";   // [student|null, ...]
const LS_GENERIC_MODE  = "ba_draft_generic_mode";      // "attacker"|"defender"|both

function loadSet(key)    { try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set(); } }
function saveSet(key, s) { localStorage.setItem(key, JSON.stringify([...s])); }
function loadLang()      { return localStorage.getItem(LS_LANG_KEY) || "zh"; }
function loadInt(key, def) { return parseInt(localStorage.getItem(key) || String(def), 10); }
function loadJSON(key, def) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; } }

// Default free students — Shiroko (swimsuit) 20027
const DEFAULT_FREE_IDS = [20027];

export const useDraftStore = create((set, get) => {
  const initSide   = loadInt(LS_SIDE_BANS, 5);
  const initShare  = loadInt(LS_SHARED_BANS, 0);
  const initFreeIds = loadSet(LS_FREE_IDS).size > 0
    ? loadSet(LS_FREE_IDS)
    : new Set(DEFAULT_FREE_IDS);
  const initProtected = loadJSON(LS_PROTECTED_KEY, Array(4).fill(null));
  const initGenericModes = loadJSON(LS_GENERIC_MODE, { attacker: true, defender: true });

  return {
    // ── Student data ────────────────────────────────────────
    students:  [],
    loading:   true,
    error:     null,
    language:  loadLang(),

    // ── Archive ─────────────────────────────────────────────
    archivedIds:      loadSet(LS_ARCHIVE_KEY),
    archivePanelOpen: false,

    // ── Ban slot counts ─────────────────────────────────────
    sideBanCount:   initSide,
    sharedBanCount: initShare,

    // ── Ban state ───────────────────────────────────────────
    attackerBans: Array(initSide).fill(null),
    sharedBans:   Array(initShare).fill(null),
    defenderBans: Array(initSide).fill(null),

    // ── Pick state ──────────────────────────────────────────
    // In 4+2 mode: { main: [4], support: [2] }
    // In generic mode: { main: [6], support: [] }
    // Initialize array shape to match the persisted generic mode
    attackerPicks: initGenericModes.attacker
      ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
      : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },
    defenderPicks: initGenericModes.defender
      ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
      : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },

    // ── Generic mode (6-slot) per side ───────────────────────
    genericMode: initGenericModes,   // { attacker: bool, defender: bool }

    // ── Players ─────────────────────────────────────────────
    attackerName:      "攻击方",
    defenderName:      "防守方",
    attackerAvatarUrl: null,
    defenderAvatarUrl: null,

    // ── Timer ───────────────────────────────────────────────
    timerSeconds:    60,
    timerInput:      60,
    timerRunning:    false,
    timerIntervalId: null,

    // ── Special rules ────────────────────────────────────────
    releaseMode:              false,
    releaseModeBlockedWarning: false,

    // ── Scores ───────────────────────────────────────────────
    attackerScore: 0,
    defenderScore: 0,

    // ── Free students (can be duplicated, any slot) ──────────
    freeStudentIds:    initFreeIds,        // Set<number>
    freeStudentPanelPos: { x: 80, y: 200 }, // floating panel position

    // ── Protected slots (4 slots, immune to banning) ─────────
    protectedSlots: initProtected,   // (student | null)[4]

    // ── Modal ───────────────────────────────────────────────
    showResetModal:        false,
    showPartialResetModal: false,

    // ── Derived helpers ─────────────────────────────────────
    getBannedIds: () => {
      const s = get();
      const ids = new Set();
      s.attackerBans.forEach(b => b && ids.add(b.id));
      s.defenderBans.forEach(b => b && ids.add(b.id));
      s.sharedBans.forEach(b => b && ids.add(b.id));
      return ids;
    },
    getPickedIds: () => {
      const s = get();
      const ids = new Set();
      const collect = (picks) => {
        [...picks.main, ...picks.support].forEach(p => p && ids.add(p.id));
      };
      collect(s.attackerPicks);
      collect(s.defenderPicks);
      return ids;
    },
    getProtectedIds: () => {
      const s = get();
      const ids = new Set();
      s.protectedSlots.forEach(p => p && ids.add(p.id));
      return ids;
    },
    isGeneric: (side) => get().genericMode[side] === true,

    // ── Language ─────────────────────────────────────────────
    setLanguage: (lang) => {
      localStorage.setItem(LS_LANG_KEY, lang);
      set({ language: lang, students: [], loading: true, error: null });
    },

    // ── Student data ─────────────────────────────────────────
    setStudents: (students) => set({ students, loading: false }),
    setError:    (error)    => set({ error, loading: false }),

    // ── Generic mode toggle ───────────────────────────────────
    toggleGenericMode: (side) => {
      set(s => {
        const gm = { ...s.genericMode, [side]: !s.genericMode[side] };
        localStorage.setItem(LS_GENERIC_MODE, JSON.stringify(gm));
        const key = side === "attacker" ? "attackerPicks" : "defenderPicks";
        const picks = s[key];
        if (gm[side]) {
          // Switching TO generic: merge main+support into one 6-slot array
          const merged = [...picks.main, ...picks.support];
          const generic = merged.slice(0, GENERIC_SLOTS);
          while (generic.length < GENERIC_SLOTS) generic.push(null);
          return { genericMode: gm, [key]: { main: generic, support: [] } };
        } else {
          // Switching FROM generic: split back to 4+2
          const all = picks.main.slice(0, GENERIC_SLOTS);
          return { genericMode: gm, [key]: {
            main:    all.slice(0, MAIN_PICK_SLOTS),
            support: all.slice(MAIN_PICK_SLOTS, MAIN_PICK_SLOTS + SUP_PICK_SLOTS),
          }};
        }
      });
    },

    // ── Archive ──────────────────────────────────────────────
    toggleArchivePanel: () => set(s => ({ archivePanelOpen: !s.archivePanelOpen })),
    archiveStudent: (id) => {
      const next = new Set(get().archivedIds); next.add(id);
      saveSet(LS_ARCHIVE_KEY, next); set({ archivedIds: next });
    },
    unarchiveStudent: (id) => {
      const next = new Set(get().archivedIds); next.delete(id);
      saveSet(LS_ARCHIVE_KEY, next); set({ archivedIds: next });
    },

    // ── Ban slot counts ───────────────────────────────────────
    setSideBanCount: (n) => {
      const count = Math.max(0, Math.min(10, n));
      localStorage.setItem(LS_SIDE_BANS, count);
      set(s => ({
        sideBanCount: count,
        attackerBans: resizeArray(s.attackerBans, count),
        defenderBans: resizeArray(s.defenderBans, count),
      }));
    },
    setSharedBanCount: (n) => {
      const count = Math.max(0, Math.min(80, n));
      localStorage.setItem(LS_SHARED_BANS, count);
      set(s => ({ sharedBanCount: count, sharedBans: resizeArray(s.sharedBans, count) }));
    },

    // ── Ban actions ───────────────────────────────────────────
    banStudentToSlot: (side, slotIdx, student) => {
      // Protected students cannot be banned
      if (get().getProtectedIds().has(student.id)) return;
      const key = side === "attacker" ? "attackerBans"
                : side === "defender" ? "defenderBans" : "sharedBans";
      set(s => { const slots = [...s[key]]; slots[slotIdx] = student; return { [key]: slots }; });
    },
    removeBan: (side, slotIdx) => {
      const key = side === "attacker" ? "attackerBans"
                : side === "defender" ? "defenderBans" : "sharedBans";
      set(s => { const slots = [...s[key]]; slots[slotIdx] = null; return { [key]: slots }; });
    },

    // ── Pick actions (with swap support) ─────────────────────
    // source: null | { side, slotType, slotIdx }  — origin slot when reordering
    pickStudentToSlot: (side, slotType, slotIdx, student, source = null) => {
      // No-op if dragging a slot onto itself
      if (source && source.side === side && source.slotType === slotType && source.slotIdx === slotIdx) return;
      const key = side === "attacker" ? "attackerPicks" : "defenderPicks";
      set(s => {
        const picks = { main: [...s[key].main], support: [...s[key].support] };
        const displaced = picks[slotType][slotIdx]; // whatever is currently in target

        // Place new student in target
        picks[slotType][slotIdx] = student;

        // If dragged FROM another pick slot on same side, put displaced (or null) back there
        if (source && source.side === side) {
          const srcArr = picks[source.slotType];
          srcArr[source.slotIdx] = displaced; // swap
        }

        return { [key]: picks };
      });
    },
    // Cross-side slot drag: source is on opposite side — just clear the source slot
    pickStudentToSlotCross: (targetSide, slotType, slotIdx, student, source) => {
      const targetKey = targetSide === "attacker" ? "attackerPicks" : "defenderPicks";
      const sourceKey = source.side === "attacker" ? "attackerPicks" : "defenderPicks";
      set(s => {
        const tPicks = { main: [...s[targetKey].main], support: [...s[targetKey].support] };
        const sPicks = source.side === targetSide ? tPicks
          : { main: [...s[sourceKey].main], support: [...s[sourceKey].support] };
        tPicks[slotType][slotIdx] = student;
        sPicks[source.slotType][source.slotIdx] = null;
        if (source.side === targetSide) return { [targetKey]: tPicks };
        return { [targetKey]: tPicks, [sourceKey]: sPicks };
      });
    },
    removePick: (side, slotType, slotIdx) => {
      const key = side === "attacker" ? "attackerPicks" : "defenderPicks";
      set(s => {
        const picks = { main: [...s[key].main], support: [...s[key].support] };
        picks[slotType][slotIdx] = null;
        return { [key]: picks };
      });
    },

    // ── Player info ───────────────────────────────────────────
    setAttackerName:      (v) => set({ attackerName: v }),
    setDefenderName:      (v) => set({ defenderName: v }),
    setAttackerAvatarUrl: (v) => set({ attackerAvatarUrl: v }),
    setDefenderAvatarUrl: (v) => set({ defenderAvatarUrl: v }),
    swapPlayers: () => set(s => ({
      attackerName:      s.defenderName,      defenderName:      s.attackerName,
      attackerAvatarUrl: s.defenderAvatarUrl, defenderAvatarUrl: s.attackerAvatarUrl,
      attackerScore:     s.defenderScore,     defenderScore:     s.attackerScore,
    })),

    // ── Timer ─────────────────────────────────────────────────
    setTimerInput: (v) => set({ timerInput: Math.max(1, parseInt(v) || 60) }),
    startTimer: () => {
      const s = get();
      if (s.timerIntervalId) clearInterval(s.timerIntervalId);
      const id = setInterval(() => {
        const cur = get().timerSeconds;
        if (cur <= 1) { clearInterval(get().timerIntervalId); set({ timerSeconds: 0, timerRunning: false, timerIntervalId: null }); }
        else          { set({ timerSeconds: cur - 1 }); }
      }, 1000);
      set({ timerSeconds: s.timerInput, timerRunning: true, timerIntervalId: id });
    },
    stopTimer: () => { const s = get(); if (s.timerIntervalId) clearInterval(s.timerIntervalId); set({ timerRunning: false, timerIntervalId: null }); },
    resetTimer: () => { const s = get(); if (s.timerIntervalId) clearInterval(s.timerIntervalId); set({ timerSeconds: s.timerInput, timerRunning: false, timerIntervalId: null }); },

    // ── Scores ───────────────────────────────────────────────
    setAttackerScore: (v) => set({ attackerScore: Math.max(0, Math.min(99, parseInt(v) || 0)) }),
    setDefenderScore: (v) => set({ defenderScore: Math.max(0, Math.min(99, parseInt(v) || 0)) }),

    // ── Release mode ──────────────────────────────────────────
    toggleReleaseMode: () => {
      const s = get();
      if (!s.releaseMode) { set({ releaseMode: true }); return; }
      const bannedIds = s.getBannedIds();
      const freeIds   = s.freeStudentIds;
      const allPicks  = [...s.attackerPicks.main, ...s.attackerPicks.support,
                         ...s.defenderPicks.main, ...s.defenderPicks.support].filter(Boolean);
      const seen = new Set();
      for (const p of allPicks) {
        if (freeIds.has(p.id)) continue; // free students exempt from duplicate check
        if (bannedIds.has(p.id) || seen.has(p.id)) {
          set({ releaseModeBlockedWarning: true });
          setTimeout(() => set({ releaseModeBlockedWarning: false }), 2000);
          return;
        }
        seen.add(p.id);
      }
      set({ releaseMode: false });
    },

    // ── Free students ─────────────────────────────────────────
    addFreeStudent: (id) => {
      const next = new Set(get().freeStudentIds); next.add(id);
      saveSet(LS_FREE_IDS, next); set({ freeStudentIds: next });
    },
    removeFreeStudent: (id) => {
      const next = new Set(get().freeStudentIds); next.delete(id);
      saveSet(LS_FREE_IDS, next); set({ freeStudentIds: next });
    },
    setFreeStudentPanelPos: (pos) => set({ freeStudentPanelPos: pos }),

    // ── Protected slots ───────────────────────────────────────
    setProtectedSlot: (idx, student) => {
      set(s => {
        const slots = [...s.protectedSlots];
        slots[idx] = student;
        localStorage.setItem(LS_PROTECTED_KEY, JSON.stringify(slots));
        return { protectedSlots: slots };
      });
    },
    swapProtectedSlot: (idx, student, source) => {
      // student: new student to place; source: { kind:"protected", slotIdx } or null
      set(s => {
        const slots = [...s.protectedSlots];
        const displaced = slots[idx];
        slots[idx] = student;
        if (source && source.kind === "protected") {
          slots[source.slotIdx] = displaced;
        }
        localStorage.setItem(LS_PROTECTED_KEY, JSON.stringify(slots));
        return { protectedSlots: slots };
      });
    },
    removeProtectedSlot: (idx) => {
      set(s => {
        const slots = [...s.protectedSlots];
        slots[idx] = null;
        localStorage.setItem(LS_PROTECTED_KEY, JSON.stringify(slots));
        return { protectedSlots: slots };
      });
    },

    // ── Resets ────────────────────────────────────────────────
    openResetModal:        () => set({ showResetModal: true }),
    closeResetModal:       () => set({ showResetModal: false }),
    openPartialResetModal: () => set({ showPartialResetModal: true }),
    closePartialResetModal:() => set({ showPartialResetModal: false }),

    // Partial reset: clear only per-side bans + picks, keep shared bans & scores
    confirmPartialReset: () => {
      const s = get();
      set({
        attackerBans:  Array(s.sideBanCount).fill(null),
        defenderBans:  Array(s.sideBanCount).fill(null),
        // Preserve generic mode array shape
        attackerPicks: s.genericMode.attacker
          ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
          : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },
        defenderPicks: s.genericMode.defender
          ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
          : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },
        showPartialResetModal: false,
        releaseMode: false,
      });
    },

    // Full reset
    confirmReset: () => {
      const s = get();
      if (s.timerIntervalId) clearInterval(s.timerIntervalId);
      set({
        attackerBans:  Array(s.sideBanCount).fill(null),
        defenderBans:  Array(s.sideBanCount).fill(null),
        sharedBans:    Array(s.sharedBanCount).fill(null),
        // Preserve generic mode array shape
        attackerPicks: s.genericMode.attacker
          ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
          : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },
        defenderPicks: s.genericMode.defender
          ? { main: Array(GENERIC_SLOTS).fill(null), support: [] }
          : { main: Array(MAIN_PICK_SLOTS).fill(null), support: Array(SUP_PICK_SLOTS).fill(null) },
        timerSeconds:  60, timerInput: 60,
        timerRunning:  false, timerIntervalId: null,
        showResetModal: false, releaseMode: false,
        attackerScore: 0, defenderScore: 0,
      });
    },
  };
});

function resizeArray(arr, newLen) {
  if (newLen >= arr.length) return [...arr, ...Array(newLen - arr.length).fill(null)];
  return arr.slice(0, newLen);
}

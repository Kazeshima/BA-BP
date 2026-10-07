import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectLocale, type Locale } from "../i18n/locale";
import { readLegacySettings } from "../lib/legacy";
import { NAME_LANGS, type NameLang, type Server } from "../lib/schaledb";
import { MAX_SHARED_BANS, MAX_SIDE_BANS, type Side, type StudentId } from "../types";

export type Theme = "system" | "light" | "dark";

export interface SettingsState {
  locale: Locale;
  nameLang: NameLang;
  server: Server;
  theme: Theme;
  sideBanCount: number;
  sharedBanCount: number;
  generic: Record<Side, boolean>;
  freeIds: StudentId[];
  archivedIds: StudentId[];
  timerDuration: number;
  sound: boolean;
  cardSize: number;
  specialPanelOpen: boolean;

  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  toggleFree: (id: StudentId) => void;
  toggleArchived: (id: StudentId) => void;
  restoreAllArchived: () => void;
}

/** Shiroko (Swimsuit) — the default free student from v1. */
const DEFAULT_FREE_IDS = [20027];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n) || 0));
export const clampSideBans = (n: number) => clamp(n, 0, MAX_SIDE_BANS);
export const clampSharedBans = (n: number) => clamp(n, 0, MAX_SHARED_BANS);

function initialState() {
  const legacy = readLegacySettings();
  const locale = detectLocale();
  const nameLang = NAME_LANGS.includes(legacy.nameLang as NameLang)
    ? (legacy.nameLang as NameLang)
    : locale === "zh"
      ? "zh"
      : "en";
  return {
    locale,
    nameLang,
    server: "jp" as Server,
    theme: "system" as Theme,
    sideBanCount: clampSideBans(legacy.sideBanCount ?? 5),
    sharedBanCount: clampSharedBans(legacy.sharedBanCount ?? 0),
    generic: legacy.generic ?? { attacker: true, defender: true },
    freeIds: legacy.freeIds ?? DEFAULT_FREE_IDS,
    archivedIds: legacy.archivedIds ?? [],
    timerDuration: 60,
    sound: true,
    cardSize: 76,
    specialPanelOpen: true,
  };
}

const toggleIn = (list: StudentId[], id: StudentId) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState(),
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      toggleFree: (id) => set((s) => ({ freeIds: toggleIn(s.freeIds, id) })),
      toggleArchived: (id) => set((s) => ({ archivedIds: toggleIn(s.archivedIds, id) })),
      restoreAllArchived: () => set({ archivedIds: [] }),
    }),
    { name: "ba-draft:settings", version: 1 },
  ),
);

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

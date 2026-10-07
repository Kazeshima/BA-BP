/**
 * Reads settings saved by v1.x so upgrading users keep their archive, free students,
 * protected slots and ban configuration. Only consulted when no v2 state exists yet.
 */
const KEYS = {
  archive: "ba_draft_archived_ids",
  lang: "ba_draft_language",
  sideBans: "ba_draft_side_ban_count",
  sharedBans: "ba_draft_shared_ban_count",
  freeIds: "ba_draft_free_ids",
  protected: "ba_draft_protected_slots",
  generic: "ba_draft_generic_mode",
} as const;

function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

const isIdArray = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === "number");

export interface LegacySettings {
  archivedIds?: number[];
  nameLang?: string;
  sideBanCount?: number;
  sharedBanCount?: number;
  freeIds?: number[];
  generic?: { attacker: boolean; defender: boolean };
}

export function readLegacySettings(): LegacySettings {
  const out: LegacySettings = {};
  const archive = read<unknown>(KEYS.archive);
  if (isIdArray(archive)) out.archivedIds = archive;
  try {
    const lang = localStorage.getItem(KEYS.lang);
    if (lang) out.nameLang = lang;
  } catch {
    // ignore
  }
  const side = read<unknown>(KEYS.sideBans);
  if (typeof side === "number") out.sideBanCount = side;
  const shared = read<unknown>(KEYS.sharedBans);
  if (typeof shared === "number") out.sharedBanCount = shared;
  const free = read<unknown>(KEYS.freeIds);
  if (isIdArray(free) && free.length > 0) out.freeIds = free;
  const generic = read<{ attacker?: unknown; defender?: unknown }>(KEYS.generic);
  if (generic && typeof generic === "object") {
    out.generic = { attacker: generic.attacker === true, defender: generic.defender === true };
  }
  return out;
}

/** v1 stored whole student objects in protected slots; v2 stores IDs only. */
export function readLegacyProtected(): (number | null)[] | undefined {
  const slots = read<unknown>(KEYS.protected);
  if (!Array.isArray(slots)) return undefined;
  return slots
    .slice(0, 4)
    .map((s) =>
      s && typeof s === "object" && typeof (s as { id?: unknown }).id === "number"
        ? (s as { id: number }).id
        : null,
    );
}

import type { SquadType, Student, TacticRole } from "../types";

export const NAME_LANGS = ["zh", "cn", "tw", "jp", "kr", "en"] as const;
export type NameLang = (typeof NAME_LANGS)[number];

export const NAME_LANG_LABELS: Record<NameLang, string> = {
  zh: "简中（民译）",
  cn: "简中（国服）",
  tw: "繁中",
  jp: "日本語",
  kr: "한국어",
  en: "English",
};

export const SERVERS = ["jp", "global", "cn"] as const;
export type Server = (typeof SERVERS)[number];
const SERVER_INDEX: Record<Server, 0 | 1 | 2> = { jp: 0, global: 1, cn: 2 };

const BASE = "https://schaledb.com";
const CACHE_PREFIX = "ba-draft:roster:";

export const studentImage = (id: number) => `${BASE}/images/student/collection/${id}.webp`;
export const studentsUrl = (lang: NameLang) => `${BASE}/data/${lang}/students.min.json`;

interface RawStudent {
  Id: number;
  Name?: string;
  DevName?: string;
  School?: string;
  SquadType?: string;
  TacticRole?: string;
  StarGrade?: number;
  BulletType?: string;
  ArmorType?: string;
  IsReleased?: boolean[];
  SearchTags?: string[];
}

export function parseStudents(raw: Record<string, RawStudent> | RawStudent[]): Student[] {
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  return list
    .filter((s) => typeof s?.Id === "number")
    .map((s) => ({
      id: s.Id,
      name: s.Name || s.DevName || String(s.Id),
      devName: s.DevName ?? "",
      school: s.School ?? "",
      // SquadType is authoritative; fall back to the ID convention (2xxxx = support).
      squadType: (s.SquadType === "Support" || s.SquadType === "Main"
        ? s.SquadType
        : s.Id >= 20000
          ? "Support"
          : "Main") as SquadType,
      role: (s.TacticRole ?? "DamageDealer") as TacticRole,
      star: s.StarGrade ?? 1,
      bullet: s.BulletType ?? "",
      armor: s.ArmorType ?? "",
      released: [!!s.IsReleased?.[0], !!s.IsReleased?.[1], !!s.IsReleased?.[2]] as Student["released"],
      tags: (s.SearchTags ?? []).filter((t) => typeof t === "string"),
    }))
    .sort((a, b) => a.id - b.id);
}

export const isReleasedOn = (s: Student, server: Server) => s.released[SERVER_INDEX[server]];

interface CachedRoster {
  savedAt: number;
  students: Student[];
}

export function readCachedRoster(lang: NameLang): CachedRoster | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRoster;
    return Array.isArray(parsed.students) && parsed.students.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedRoster(lang: NameLang, students: Student[]) {
  try {
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify({ savedAt: Date.now(), students }));
  } catch {
    // Quota exceeded or storage unavailable: the roster just won't be available offline.
  }
}

export async function fetchStudents(lang: NameLang, signal?: AbortSignal): Promise<Student[]> {
  const res = await fetch(studentsUrl(lang), { signal, cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const students = parseStudents(await res.json());
  if (students.length === 0) throw new Error("Empty roster");
  return students;
}

/** Normalised search: matches localised name, internal name, ID and SchaleDB search tags. */
export function matchesQuery(s: Student, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    s.name.toLowerCase().includes(q) ||
    s.devName.toLowerCase().includes(q) ||
    String(s.id).includes(q) ||
    s.tags.some((t) => t.toLowerCase().includes(q))
  );
}

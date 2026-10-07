import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Crosshair, EyeOff, FilterX, Search, Shield, Trash2 } from "lucide-react";
import { type ReactNode, useDeferredValue, useMemo, useState } from "react";
import type { DragData, DropData } from "../dnd/types";
import { useBoardIndex } from "../hooks/useBoard";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/zh";
import { isReleasedOn, matchesQuery } from "../lib/schaledb";
import { useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import { useSettings } from "../store/settings";
import type { Side, TacticRole } from "../types";
import { StudentCard } from "./StudentCard";
import { ARMOR_TYPES, BULLET_TYPES, TYPE_COLORS } from "./ui/TypeBadges";

const ROLES: TacticRole[] = ["DamageDealer", "Tanker", "Healer", "Supporter", "Vehicle"];
type Squad = "all" | "Main" | "Support";

const POOL_DROP: DropData = { target: { kind: "pool" } };

function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1">{children}</div>;
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" aria-hidden />;
}

export function Roster() {
  const t = useT();
  const students = useRoster((s) => s.students);
  const server = useSettings((s) => s.server);
  const archivedIds = useSettings((s) => s.archivedIds);
  const freeIds = useSettings((s) => s.freeIds);
  const cardSize = useSettings((s) => s.cardSize);
  const releaseMode = useDraft((s) => s.releaseMode);
  const index = useBoardIndex();

  const [query, setQuery] = useState("");
  const [squad, setSquad] = useState<Squad>("all");
  const [roles, setRoles] = useState<Set<TacticRole>>(new Set());
  const [bullets, setBullets] = useState<Set<string>>(new Set());
  const [armors, setArmors] = useState<Set<string>>(new Set());
  const [hideBanned, setHideBanned] = useState(false);
  const [hidePicked, setHidePicked] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const { setNodeRef, isOver, active } = useDroppable({ id: "drop:pool", data: POOL_DROP });
  const draggingFromSlot = (active?.data.current as DragData | undefined)?.source.kind === "slot";

  const pool = useMemo(() => {
    const archived = new Set(archivedIds);
    return students.filter((s) => isReleasedOn(s, server) && !archived.has(s.id));
  }, [students, server, archivedIds]);

  const visible = useMemo(
    () =>
      pool.filter(
        (s) =>
          matchesQuery(s, deferredQuery) &&
          (squad === "all" || s.squadType === squad) &&
          (roles.size === 0 || roles.has(s.role)) &&
          (bullets.size === 0 || bullets.has(s.bullet)) &&
          (armors.size === 0 || armors.has(s.armor)) &&
          !(hideBanned && index.banned.has(s.id)) &&
          !(hidePicked && index.picked.has(s.id)),
      ),
    [pool, deferredQuery, squad, roles, bullets, armors, hideBanned, hidePicked, index],
  );

  const toggle = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };
  const filtersActive =
    !!query ||
    squad !== "all" ||
    roles.size > 0 ||
    bullets.size > 0 ||
    armors.size > 0 ||
    hideBanned ||
    hidePicked;
  const clearFilters = () => {
    setQuery("");
    setSquad("all");
    setRoles(new Set());
    setBullets(new Set());
    setArmors(new Set());
    setHideBanned(false);
    setHidePicked(false);
  };

  const free = useMemo(() => new Set(freeIds), [freeIds]);
  const pickedBy = (id: number): Side | "both" | null => {
    const sides = index.picked.get(id);
    if (!sides) return null;
    return sides.length > 1 ? "both" : (sides[0] ?? null);
  };

  return (
    <div className="panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-line border-b px-3 py-2">
        <label className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle"
            size={15}
          />
          <input
            id="roster-search"
            className="input w-56 pl-8"
            placeholder={t("grid.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            type="search"
            autoComplete="off"
          />
        </label>

        <ChipGroup>
          {(["all", "Main", "Support"] as Squad[]).map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              data-active={squad === s}
              onClick={() => setSquad(s)}
            >
              {t(s === "all" ? "grid.all" : s === "Main" ? "grid.main" : "grid.support")}
            </button>
          ))}
        </ChipGroup>
        <Divider />
        <ChipGroup>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className="chip"
              data-active={roles.has(r)}
              onClick={() => setRoles((cur) => toggle(cur, r))}
            >
              {t(`role.${r}`)}
            </button>
          ))}
        </ChipGroup>
        <Divider />
        <ChipGroup>
          {BULLET_TYPES.map((b) => (
            <TypeChip
              key={b}
              kind="bullet"
              color={TYPE_COLORS[b]}
              active={bullets.has(b)}
              label={t(`bullet.${b}` as MessageKey)}
              onClick={() => setBullets((cur) => toggle(cur, b))}
            />
          ))}
        </ChipGroup>
        <Divider />
        <ChipGroup>
          {ARMOR_TYPES.map((a) => (
            <TypeChip
              key={a}
              kind="armor"
              color={TYPE_COLORS[a]}
              active={armors.has(a)}
              label={t(`armor.${a}` as MessageKey)}
              onClick={() => setArmors((cur) => toggle(cur, a))}
            />
          ))}
        </ChipGroup>
        <Divider />
        <ChipGroup>
          <button
            type="button"
            className="chip"
            data-active={hideBanned}
            onClick={() => setHideBanned((v) => !v)}
          >
            <EyeOff size={13} />
            {t("grid.hideBanned")}
          </button>
          <button
            type="button"
            className="chip"
            data-active={hidePicked}
            onClick={() => setHidePicked((v) => !v)}
          >
            <EyeOff size={13} />
            {t("grid.hidePicked")}
          </button>
        </ChipGroup>

        <div className="ml-auto flex items-center gap-3">
          {filtersActive && (
            <button type="button" className="chip" onClick={clearFilters}>
              <FilterX size={13} />
              {t("grid.clearFilters")}
            </button>
          )}
          <label className="flex items-center gap-1.5 text-muted text-xs" title={t("grid.cardSize")}>
            <input
              type="range"
              min={56}
              max={112}
              step={4}
              value={cardSize}
              onChange={(e) => useSettings.getState().set("cardSize", Number(e.target.value))}
              className="w-20 accent-[var(--brand)]"
              aria-label={t("grid.cardSize")}
            />
          </label>
          <span className="font-mono text-muted text-xs tabular-nums">
            {visible.length}/{pool.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "relative min-h-0 flex-1 overflow-y-auto p-3 transition-colors",
          draggingFromSlot && isOver && "bg-ban-soft",
        )}
      >
        {draggingFromSlot && (
          <div className="pointer-events-none sticky top-0 z-10 mx-auto mb-2 flex w-fit items-center gap-2 rounded-full border border-ban bg-surface px-4 py-1.5 font-bold text-ban text-sm shadow-float">
            <Trash2 size={15} /> {t("grid.dropToRemove")}
          </div>
        )}
        {visible.length === 0 ? (
          <div className="grid h-full place-items-center text-muted">{t("grid.empty")}</div>
        ) : (
          <div
            className="grid justify-center gap-2"
            style={{ gridTemplateColumns: `repeat(auto-fill, ${cardSize}px)` }}
          >
            {visible.map((s) => {
              const banned = index.banned.has(s.id);
              const isFree = free.has(s.id);
              return (
                <StudentCard
                  key={s.id}
                  student={s}
                  origin="roster"
                  size={cardSize}
                  banned={banned}
                  pickedBy={pickedBy(s.id)}
                  isProtected={index.protectedIds.has(s.id)}
                  isFree={isFree}
                  locked={banned && !isFree && !releaseMode}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Icon-only filter for attack/armor types, coloured like the in-game badges. */
function TypeChip({
  kind,
  color,
  active,
  label,
  onClick,
}: {
  kind: "bullet" | "armor";
  color: string | undefined;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = kind === "bullet" ? Crosshair : Shield;
  return (
    <button
      type="button"
      className="grid size-7 place-items-center rounded-full border-2 transition-transform hover:scale-110"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      style={{
        borderColor: color,
        background: active ? color : "var(--surface)",
        color: active ? "#fff" : color,
        boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${color} 30%, transparent)` : undefined,
      }}
    >
      <Icon size={14} strokeWidth={2.75} />
    </button>
  );
}

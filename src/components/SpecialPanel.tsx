import clsx from "clsx";
import { PanelLeftClose, Plus, Search, Shield, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "../i18n";
import { matchesQuery } from "../lib/schaledb";
import { useRoster } from "../store/roster";
import { useSettings } from "../store/settings";
import { PROTECTED_SLOTS, type SlotRef } from "../types";
import { Slot } from "./Slot";
import { StudentCard } from "./StudentCard";
import { Portrait } from "./ui/Portrait";

function FreeSearch() {
  const t = useT();
  const students = useRoster((s) => s.students);
  const freeIds = useSettings((s) => s.freeIds);
  const toggleFree = useSettings((s) => s.toggleFree);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const free = new Set(freeIds);
    return students.filter((s) => !free.has(s.id) && matchesQuery(s, query)).slice(0, 8);
  }, [query, students, freeIds]);

  const choose = (id: number) => {
    toggleFree(id);
    setQuery("");
    setCursor(0);
  };

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle"
        size={14}
      />
      <input
        className="input h-8 w-full pl-8 text-[13px]"
        placeholder={t("special.freeSearch")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setCursor(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, suggestions.length - 1));
          else if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
          else if (e.key === "Enter" && suggestions[cursor]) choose(suggestions[cursor].id);
          else if (e.key === "Escape") setQuery("");
        }}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="free-suggestions"
      />
      {open && suggestions.length > 0 && (
        <div
          id="free-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-float"
        >
          {suggestions.map((s, i) => (
            <div
              key={s.id}
              role="option"
              tabIndex={-1}
              aria-selected={i === cursor}
              className={clsx(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1",
                i === cursor && "bg-brand-soft",
              )}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s.id);
              }}
            >
              <span className="relative size-7 shrink-0 overflow-hidden rounded">
                <Portrait student={s} />
              </span>
              <span className="truncate font-semibold text-[13px]">{s.name}</span>
              <Plus className="ml-auto shrink-0 text-subtle" size={14} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpecialPanel() {
  const t = useT();
  const open = useSettings((s) => s.specialPanelOpen);
  const freeIds = useSettings((s) => s.freeIds);
  const byId = useRoster((s) => s.byId);

  if (!open) return null;

  const freeStudents = freeIds.map((id) => byId.get(id)).filter((s) => s != null);

  return (
    <aside className="panel flex w-[244px] shrink-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-line border-b py-1.5 pr-1.5 pl-3">
        <span className="font-bold text-sm">{t("special.title")}</span>
        <button
          type="button"
          className="btn btn-icon ml-auto size-7 border-transparent bg-transparent"
          onClick={() => useSettings.getState().set("specialPanelOpen", false)}
          aria-label={t("special.close")}
          title={t("special.close")}
        >
          <PanelLeftClose />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <section className="flex flex-col gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[13px]">
              <Shield size={14} className="text-ok" /> {t("special.protected")}
            </div>
            <p className="text-subtle text-xs">{t("special.protectedHint")}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: PROTECTED_SLOTS }, (_, index) => {
              const slot: SlotRef = { zone: "protected", index };
              return <Slot key={index} slot={slot} compact />;
            })}
          </div>
        </section>

        <div className="h-px shrink-0 bg-line" />

        <section className="flex flex-col gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[13px]">
              <Star size={14} className="text-gold" fill="currentColor" /> {t("special.free")}
            </div>
            <p className="text-subtle text-xs">{t("special.freeHint")}</p>
          </div>
          <FreeSearch />
          {freeStudents.length === 0 ? (
            <p className="py-1 text-muted text-xs">{t("special.freeEmpty")}</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,52px)] gap-1.5">
              {freeStudents.map((s) => (
                <div key={s.id} className="group relative">
                  <StudentCard student={s} origin="free" size={52} isFree />
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 z-10 hidden size-5 place-items-center rounded-full bg-ban text-white shadow group-hover:grid"
                    onClick={() => useSettings.getState().toggleFree(s.id)}
                    aria-label={t("menu.removeFree")}
                    title={t("menu.removeFree")}
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}

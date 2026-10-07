import clsx from "clsx";
import { ArchiveRestore, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useT } from "../i18n";
import { matchesQuery } from "../lib/schaledb";
import { useRoster } from "../store/roster";
import { useSettings } from "../store/settings";
import { StudentCard } from "./StudentCard";

export function ArchiveDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const archivedIds = useSettings((s) => s.archivedIds);
  const restoreAll = useSettings((s) => s.restoreAllArchived);
  const byId = useRoster((s) => s.byId);
  const [query, setQuery] = useState("");

  const students = useMemo(
    () =>
      archivedIds
        .map((id) => byId.get(id))
        .filter((s) => s != null)
        .filter((s) => matchesQuery(s, query))
        .sort((a, b) => a.id - b.id),
    [archivedIds, byId, query],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <aside
      className={clsx(
        "panel fixed top-2 right-2 bottom-2 z-[60] flex w-[340px] flex-col shadow-float transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+16px)]",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <header className="flex items-center gap-2 border-line border-b px-4 py-3">
        <h2 className="font-bold text-base">{t("archive.title")}</h2>
        <span className="rounded-full bg-surface-3 px-2 font-mono text-muted text-xs">
          {t("archive.count", { count: archivedIds.length })}
        </span>
        <button
          type="button"
          className="btn btn-icon ml-auto border-transparent"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <X />
        </button>
      </header>
      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="text-muted text-xs">{t("archive.hint")}</p>
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle"
              size={14}
            />
            <input
              className="input w-full pl-8"
              placeholder={t("archive.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
            />
          </label>
          <button
            type="button"
            className="btn"
            onClick={restoreAll}
            disabled={archivedIds.length === 0}
            title={t("archive.restoreAll")}
          >
            <ArchiveRestore />
            {t("archive.restoreAll")}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {students.length === 0 ? (
          <p className="py-8 text-center text-muted text-sm">
            {archivedIds.length === 0 ? t("archive.empty") : t("grid.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,68px)] justify-center gap-2">
            {students.map((s) => (
              <StudentCard key={s.id} student={s} origin="archive" size={68} isArchived />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

import { useDraggable } from "@dnd-kit/core";
import { Archive, ArchiveRestore, Ban, Shield, ShieldOff, Star, StarOff } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DragData } from "../dnd/types";
import { t as translate, useT } from "../i18n";
import { useDraft } from "../store/draft";
import { useSettings } from "../store/settings";
import type { Side, Student } from "../types";
import { ContextMenu, type MenuItem } from "./ui/ContextMenu";
import { Portrait } from "./ui/Portrait";
import { TypeBadges } from "./ui/TypeBadges";

export interface CardStatus {
  banned?: boolean;
  pickedBy?: Side | "both" | null;
  isProtected?: boolean;
  isFree?: boolean;
  isArchived?: boolean;
}

interface Props extends CardStatus {
  student: Student;
  /** Distinguishes multiple draggable copies of the same student (roster, free panel, archive). */
  origin: string;
  /** Banned students can't be dragged unless special rules are on or they're free. */
  locked?: boolean;
  size?: number;
}

export const StudentCard = memo(function StudentCard({
  student,
  origin,
  banned,
  pickedBy,
  isProtected,
  isFree,
  isArchived,
  locked,
  size,
}: Props) {
  const t = useT();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const data: DragData = useMemo(() => ({ studentId: student.id, source: { kind: "pool" } }), [student.id]);
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `${origin}:${student.id}`,
    data,
    disabled: locked,
  });
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems = (): MenuItem[] => {
    const settings = useSettings.getState();
    const draft = useDraft.getState();
    return [
      isArchived
        ? {
            label: t("menu.unarchive"),
            icon: ArchiveRestore,
            onSelect: () => settings.toggleArchived(student.id),
          }
        : { label: t("menu.archive"), icon: Archive, onSelect: () => settings.toggleArchived(student.id) },
      isFree
        ? { label: t("menu.removeFree"), icon: StarOff, onSelect: () => settings.toggleFree(student.id) }
        : { label: t("menu.addFree"), icon: Star, onSelect: () => settings.toggleFree(student.id) },
      isProtected
        ? { label: t("menu.unprotect"), icon: ShieldOff, onSelect: () => draft.unprotect(student.id) }
        : {
            label: t("menu.protect"),
            icon: Shield,
            onSelect: () => {
              const r = draft.protect(student.id);
              if (r && !r.ok) toast.error(translate(`reason.${r.reason}`, { name: student.name }));
            },
          },
    ];
  };

  const pickedSide = pickedBy === "both" ? "attacker" : pickedBy;
  const statusLabel = [
    banned && t("card.banned"),
    pickedBy && t("card.pickedBy", { side: t(`side.${pickedSide ?? "attacker"}`) }),
    isProtected && t("card.protected"),
    isFree && t("card.free"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* role="button" and tabIndex come from dnd-kit's `attributes`. */}
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: see above */}
      <div
        ref={setNodeRef}
        className="card"
        style={size ? ({ "--card-size": `${size}px` } as React.CSSProperties) : undefined}
        data-banned={banned ? "true" : undefined}
        data-picked={pickedSide ?? undefined}
        data-dragging={isDragging ? "true" : undefined}
        title={statusLabel ? `${student.name} — ${statusLabel}` : student.name}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        {...attributes}
        {...listeners}
        aria-label={statusLabel ? `${student.name}, ${statusLabel}` : student.name}
      >
        <Portrait student={student} />
        <TypeBadges
          bullet={student.bullet}
          armor={student.armor}
          size={Math.max(12, Math.round((size ?? 76) / 5.4))}
        />

        <div className="pointer-events-none absolute top-[3px] right-[3px] z-[4] flex flex-col items-end gap-[2px]">
          {student.squadType === "Support" && (
            <span className="rounded bg-[rgb(10_16_30/0.7)] px-1 font-bold text-[10px] text-white leading-[15px]">
              SP
            </span>
          )}
          {isProtected && (
            <span className="grid size-[17px] place-items-center rounded-full bg-ok text-white">
              <Shield size={11} strokeWidth={3} />
            </span>
          )}
          {isFree && (
            <span className="grid size-[17px] place-items-center rounded-full bg-gold text-white">
              <Star size={11} strokeWidth={3} fill="currentColor" />
            </span>
          )}
        </div>

        {pickedBy && (
          <span
            className="absolute inset-x-0 top-1/2 z-[3] -translate-y-1/2 py-0.5 text-center font-bold text-[11px] text-white tracking-widest"
            style={{
              background:
                pickedBy === "both"
                  ? "linear-gradient(90deg, var(--atk), var(--def))"
                  : `color-mix(in srgb, var(--${pickedBy === "attacker" ? "atk" : "def"}) 88%, transparent)`,
            }}
          >
            {pickedBy === "both"
              ? `${t("side.attacker.short")}/${t("side.defender.short")}`
              : t(`side.${pickedBy}.short`)}
          </span>
        )}
        {banned && (
          <span className="absolute inset-0 z-[3] grid place-items-center text-ban">
            <Ban size="55%" strokeWidth={2.5} />
          </span>
        )}
        <div className="nameplate">{student.name}</div>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={closeMenu} />}
    </>
  );
});

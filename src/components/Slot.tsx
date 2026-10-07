import { useDraggable, useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Ban, Plus, ShieldCheck, X } from "lucide-react";
import { type CSSProperties, memo, useMemo } from "react";
import type { DragData, DropData } from "../dnd/types";
import { useT } from "../i18n";
import { applyDrop, getSlot, slotKey, slotSquadRequirement } from "../lib/rules";
import { ruleContext, useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import { useSettings } from "../store/settings";
import type { SlotRef } from "../types";
import { Portrait } from "./ui/Portrait";
import { TypeBadges } from "./ui/TypeBadges";

interface SlotProps {
  slot: SlotRef;
  invalid?: boolean;
  /** Hide name and type badges on very small slots. */
  compact?: boolean;
  /** Fixed pixel size; omit to fill the parent's grid cell. */
  size?: number;
  className?: string;
}

const ZONE_COLOR: Record<string, string> = {
  "ban:attacker": "var(--ban)",
  "ban:defender": "var(--ban)",
  "ban:shared": "var(--gold)",
  "pick:attacker": "var(--atk)",
  "pick:defender": "var(--def)",
  protected: "var(--ok)",
};

export const Slot = memo(
  function Slot({ slot: slotProp, invalid, compact, size, className }: SlotProps) {
    const t = useT();
    const key = slotKey(slotProp);
    // Parents pass fresh objects each render; key the identity on the address instead.
    // biome-ignore lint/correctness/useExhaustiveDependencies: slotKey fully identifies the slot
    const slot = useMemo(() => slotProp, [key]);
    const studentId = useDraft((s) => getSlot(s.board, slot));
    const student = useRoster((s) => (studentId != null ? s.byId.get(studentId) : undefined));
    const generic = useSettings((s) => (slot.zone === "pick" ? s.generic[slot.side] : true));
    const clear = useDraft((s) => s.clear);

    const dropData: DropData = useMemo(() => ({ target: { kind: "slot", slot } }), [slot]);
    const { setNodeRef: setDropRef, isOver, active } = useDroppable({ id: `drop:${key}`, data: dropData });

    const dragData: DragData | undefined = useMemo(
      () => (studentId != null ? { studentId, source: { kind: "slot", slot } } : undefined),
      [studentId, slot],
    );
    const {
      setNodeRef: setDragRef,
      attributes,
      listeners,
      isDragging,
    } = useDraggable({ id: `slot:${key}`, data: dragData, disabled: studentId == null });

    // While something is being dragged, dry-run the drop to show whether this slot would accept it.
    const activeData = active?.data.current as DragData | undefined;
    const accept = useMemo(() => {
      if (!activeData) return undefined;
      const board = useDraft.getState().board;
      const r = applyDrop(
        board,
        activeData.source,
        { kind: "slot", slot },
        activeData.studentId,
        ruleContext(),
      );
      return r.ok ? "yes" : "no";
    }, [activeData, slot]);

    const zoneKey = slot.zone === "protected" ? "protected" : `${slot.zone}:${slot.side}`;
    const need = slotSquadRequirement(slot, { generic: { attacker: generic, defender: generic } });
    const typeTag = need === "Main" ? t("slot.main") : need === "Support" ? t("slot.support") : null;

    return (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is set dynamically below
      <div
        ref={(node) => {
          setDropRef(node);
          setDragRef(node);
        }}
        className={clsx("slot", slot.zone === "ban" && "slot-ban", className)}
        style={{ "--slot-color": ZONE_COLOR[zoneKey], width: size, height: size } as CSSProperties}
        data-filled={student || studentId != null ? "true" : undefined}
        data-over={isOver ? "true" : undefined}
        data-accept={accept}
        data-invalid={invalid ? "true" : undefined}
        data-dragging={isDragging ? "true" : undefined}
        onContextMenu={(e) => {
          e.preventDefault();
          if (studentId != null) clear(slot);
        }}
        title={student?.name}
        {...attributes}
        {...listeners}
        tabIndex={studentId != null ? 0 : -1}
        role={studentId != null ? "button" : "group"}
        aria-roledescription={undefined}
        aria-label={student?.name ?? t("slot.empty")}
      >
        {studentId != null ? (
          <>
            <Portrait student={student ?? { id: studentId, name: String(studentId) }} />
            {student && !compact && slot.zone !== "ban" && (
              <TypeBadges bullet={student.bullet} armor={student.armor} size={13} />
            )}
            {student && !compact && <div className="nameplate !text-[11px]">{student.name}</div>}
            <button
              type="button"
              className="slot-remove"
              aria-label={t("slot.remove")}
              title={t("slot.remove")}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                clear(slot);
              }}
            >
              <X size={12} strokeWidth={3} />
            </button>
          </>
        ) : slot.zone === "ban" ? (
          <Ban className="text-[var(--slot-color)] opacity-40" size="40%" strokeWidth={2.2} />
        ) : slot.zone === "protected" ? (
          <ShieldCheck className="text-[var(--slot-color)] opacity-50" size="40%" />
        ) : (
          <Plus className="text-[var(--slot-color)] opacity-50" size="36%" strokeWidth={2.5} />
        )}
        {typeTag && (
          <span
            className="type-tag"
            style={{
              background:
                need === "Main" ? "var(--slot-color)" : "color-mix(in srgb, var(--slot-color) 60%, #000)",
            }}
          >
            {typeTag}
          </span>
        )}
      </div>
    );
  },
  (a, b) =>
    slotKey(a.slot) === slotKey(b.slot) &&
    a.invalid === b.invalid &&
    a.compact === b.compact &&
    a.size === b.size &&
    a.className === b.className,
);

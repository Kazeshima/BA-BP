import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Portrait } from "../components/ui/Portrait";
import { t } from "../i18n";
import { useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import type { DragData, DropData } from "./types";

// Prefer the droppable under the pointer; fall back to overlap for fast flicks.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

export function DndRoot({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<DragData | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const student = useRoster((s) => (active ? s.byId.get(active.studentId) : undefined));

  const onDragStart = (e: DragStartEvent) =>
    setActive((e.active.data.current as DragData | undefined) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const data = e.active.data.current as DragData | undefined;
    const drop = e.over?.data.current as DropData | undefined;
    if (!data || !drop) return;
    const result = useDraft.getState().drop(data.source, drop.target, data.studentId);
    if (!result.ok) {
      const name = useRoster.getState().byId.get(result.id)?.name ?? String(result.id);
      toast.error(t(`reason.${result.reason}`, { name }), { id: "drop-rejected" });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      // Drop targets never live inside a scroll container, and auto-scroll made the roster jump.
      autoScroll={false}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }} zIndex={2000}>
        {active && (
          <div className="drag-overlay">
            <Portrait student={student ?? { id: active.studentId, name: String(active.studentId) }} />
            {student && <div className="nameplate">{student.name}</div>}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

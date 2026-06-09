import { useState } from "react";
import { useDrag } from "../hooks/useDragContext";
import { useDraftStore } from "../store/draftStore";
import TypeIcons from "./TypeIcons";

export default function AvatarSlot({
  slotType, side, slotSubType, slotIdx,
  student, onRemove, onDrop,
  showTypeTag = false, sizeOverride = null,
}) {
  const { dragging, getCurrentDrag, startDrag, endDrag, consumeDrop } = useDrag();
  const releaseMode = useDraftStore(s => s.releaseMode);
  const bannedIds   = useDraftStore(s => s.getBannedIds());
  const pickedIds   = useDraftStore(s => s.getPickedIds());
  const freeIds     = useDraftStore(s => s.freeStudentIds);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Drag out of this slot for reordering
  const handleSlotMouseDown = (e) => {
    if (e.button !== 0 || !student) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag(student, e, { kind: slotType, side, slotType: slotSubType, slotIdx });
  };

  const handleMouseEnter = () => { if (dragging) setDragOver(true); };
  const handleMouseLeave = () => setDragOver(false);

  const handleMouseUp = () => {
    // Use ref so we always get the live value even if React state cleared first
    const cur = getCurrentDrag();
    if (!cur || !dragOver) { setDragOver(false); return; }

    const s        = cur.student;
    const isFree   = freeIds.has(s.id);
    const fromSlot = cur.source !== null;

    if (!releaseMode && slotType === "pick") {
      if (!fromSlot && !isFree) {
        if (bannedIds.has(s.id) || pickedIds.has(s.id)) {
          endDrag(); setDragOver(false); return;
        }
      }
    }

    consumeDrop();
    onDrop(s, cur.source);
    endDrag();
    setDragOver(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove();
  };

  const typeTag   = slotSubType === "support" ? "S" : slotSubType === "main" ? "M" : null;
  const sizeStyle = sizeOverride ? { width: sizeOverride.width, height: sizeOverride.height } : {};
  const labelFs   = sizeOverride ? Math.max(7, Math.floor(sizeOverride.width / 9)) : undefined;

  return (
    <div
      className={[
        "avatar-slot",
        `avatar-slot--${slotType}`,
        `avatar-slot--${side}`,
        student  ? "filled"        : "",
        dragOver ? "drag-over"     : "",
        student  ? "slot-draggable": "",
      ].join(" ")}
      style={sizeStyle}
      onMouseDown={handleSlotMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      {showTypeTag && typeTag && (
        <span className={`avatar-slot__type-tag avatar-slot__type-tag--${typeTag}`}>{typeTag}</span>
      )}

      {student ? (
        <>
          {!imgError
            ? <img src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
                   alt={student.name} onError={() => setImgError(true)} draggable={false} />
            : <div className="student-card__img-loading">{student.name}</div>
          }
          {/* Type icons: show for pick slots and side bans, skip shared (side==="shared") */}
          {side !== "shared" && student.bulletType && (
            <TypeIcons
              bulletType={student.bulletType}
              armorType={student.armorType}
              size={sizeOverride ? Math.max(8, Math.floor(sizeOverride.width / 7)) : 13}
            />
          )}
          <div className="avatar-slot__label" style={labelFs ? { fontSize: labelFs } : {}}>
            {student.name}
          </div>
          <button
            className="avatar-slot__remove"
            title="从此槽移除（返回主列表）"
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseUp={handleRemove}
          >×</button>
        </>
      ) : (
        <span className="avatar-slot__empty-icon"
          style={sizeOverride && sizeOverride.width < 50 ? { fontSize: 14 } : {}}>
          +
        </span>
      )}
    </div>
  );
}

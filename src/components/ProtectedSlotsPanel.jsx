import { useState } from "react";
import { useDraftStore } from "../store/draftStore";
import { useDrag } from "../hooks/useDragContext";

/**
 * 4 protected slots — students here cannot be banned.
 * Supports drag-in from grid and drag-out to pick slots.
 * Also supports reordering between protected slots (swap).
 */
export default function ProtectedSlotsPanel() {
  const {
    protectedSlots, setProtectedSlot,
    swapProtectedSlot, removeProtectedSlot,
  } = useDraftStore();

  return (
    <div className="protected-panel">
      <div className="protected-panel__title">
        🛡️ 保护位
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>
          此处学生不可被禁用
        </span>
      </div>
      <div className="protected-panel__slots">
        {protectedSlots.map((student, i) => (
          <ProtectedSlot
            key={i}
            idx={i}
            student={student}
            onRemove={() => removeProtectedSlot(i)}
          />
        ))}
      </div>
    </div>
  );
}

function ProtectedSlot({ idx, student, onRemove }) {
  const { dragging, startDrag, endDrag } = useDrag();
  const { swapProtectedSlot } = useDraftStore();
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !student) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag(student, e, { kind: "protected", slotIdx: idx });
  };

  const handleMouseEnter = () => { if (dragging) setDragOver(true); };
  const handleMouseLeave = () => setDragOver(false);

  const handleMouseUp = () => {
    if (dragging && dragOver) {
      swapProtectedSlot(idx, dragging.student, dragging.source);
      endDrag();
    }
    setDragOver(false);
  };

  return (
    <div
      className={[
        "avatar-slot avatar-slot--pick avatar-slot--shared protected-slot",
        student  ? "filled" : "",
        dragOver ? "drag-over" : "",
        student  ? "slot-draggable" : "",
      ].join(" ")}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      title={student ? `${student.name}（受保护）` : "保护位（拖入学生）"}
    >
      {/* Shield badge */}
      <span className="protected-badge">🛡</span>

      {student ? (
        <>
          {!imgError ? (
            <img
              src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
              alt={student.name}
              onError={() => setImgError(true)}
              draggable={false}
            />
          ) : (
            <div className="student-card__img-loading">{student.name}</div>
          )}
          <div className="avatar-slot__label">{student.name}</div>
          <button
            className="avatar-slot__remove"
            title="移除"
            onMouseUp={(e) => { e.stopPropagation(); onRemove(); }}
          >×</button>
        </>
      ) : (
        <span className="avatar-slot__empty-icon">+</span>
      )}
    </div>
  );
}

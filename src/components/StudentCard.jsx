import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDrag } from "../hooks/useDragContext";
import TypeIcons from "./TypeIcons";
import { useDraftStore } from "../store/draftStore";

export default function StudentCard({ student, isBanned, isPicked, isArchived = false, isProtected = false }) {
  const { startDrag } = useDrag();
  const { archiveStudent, unarchiveStudent, releaseMode, getProtectedIds } = useDraftStore();
  isProtected = isProtected || getProtectedIds().has(student.id);
  const [imgError, setImgError] = useState(false);
  const [ctxMenu, setCtxMenu]   = useState(null); // { x, y }
  const menuRef    = useRef(null);
  const isSupporter = student.id >= 20000;

  // Close menu on any click outside
  useEffect(() => {
    if (!ctxMenu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCtxMenu(null);
      }
    };
    // Use capture so we get it before anything else
    window.addEventListener("mousedown", close, true);
    return () => window.removeEventListener("mousedown", close, true);
  }, [ctxMenu]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (ctxMenu) { setCtxMenu(null); return; }
    if (isBanned && !releaseMode && !isArchived) return;
    e.preventDefault();
    startDrag(student, e);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const cardClass = [
    "student-card",
    isBanned   ? "is-banned"   : "",
    isPicked   ? "is-picked"   : "",
    isArchived   ? "is-archived"   : "",
    isProtected  ? "is-protected"  : "",
  ].filter(Boolean).join(" ");

  // Context menu rendered into document.body via portal —
  // completely escapes any parent stacking context or overflow clipping
  const contextMenuPortal = ctxMenu && createPortal(
    <div
      ref={menuRef}
      className="ctx-menu"
      style={{ left: ctxMenu.x, top: ctxMenu.y, zIndex: 99999 }}
      onContextMenu={e => e.preventDefault()}
    >
      {isArchived ? (
        <button
          className="ctx-menu__item"
          onMouseDown={(e) => {
            e.stopPropagation();
            unarchiveStudent(student.id);
            setCtxMenu(null);
          }}
        >
          ✅ 取回至主列表
        </button>
      ) : (
        <button
          className="ctx-menu__item"
          onMouseDown={(e) => {
            e.stopPropagation();
            archiveStudent(student.id);
            setCtxMenu(null);
          }}
        >
          📦 移入存档
        </button>
      )}
      <button
        className="ctx-menu__item ctx-menu__item--cancel"
        onMouseDown={(e) => { e.stopPropagation(); setCtxMenu(null); }}
      >
        取消
      </button>
    </div>,
    document.body
  );

  return (
    <>
      <div
        className={cardClass}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        title={`${student.name}（右键存档/取消存档）`}
      >
        {isSupporter && !isArchived && (
          <span className="student-card__supporter-badge">S</span>
        )}
        {isProtected && !isArchived && (
          <span className="student-card__protected-badge" title="受保护">🛡</span>
        )}

        {releaseMode && (isBanned || isPicked) && (
          <span className="student-card__release-icon" title="特殊规则：已解锁">🔓</span>
        )}

        <TypeIcons bulletType={student.bulletType} armorType={student.armorType} size={13} />

        {!imgError ? (
          <img
            src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
            alt={student.name}
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="student-card__img-loading">?</div>
        )}
        <div className="student-card__name">{student.name}</div>
      </div>

      {contextMenuPortal}
    </>
  );
}

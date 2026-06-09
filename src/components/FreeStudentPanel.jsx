import { useState, useRef, useEffect, useMemo } from "react";
import { useDraftStore } from "../store/draftStore";
import { useDrag } from "../hooks/useDragContext";
import TypeIcons from "./TypeIcons";

export default function FreeStudentPanel() {
  const {
    students, freeStudentIds,
    freeStudentPanelPos, setFreeStudentPanelPos,
    addFreeStudent, removeFreeStudent,
    protectedSlots, swapProtectedSlot, removeProtectedSlot,
  } = useDraftStore();

  const [collapsed,    setCollapsed]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const draggingPanel = useRef(false);
  const dragOffset    = useRef({ x: 0, y: 0 });
  const searchRef     = useRef(null);

  const freeStudents = students.filter(s => freeStudentIds.has(s.id));

  // Autocomplete: filter students by name, exclude already-free ones
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(s => !freeStudentIds.has(s.id) &&
        (s.name.toLowerCase().includes(q) || (s.devName || "").toLowerCase().includes(q)))
      .slice(0, 8);
  }, [searchQuery, students, freeStudentIds]);

  // Panel drag
  const onTitleMouseDown = (e) => {
    if (e.button !== 0) return;
    draggingPanel.current = true;
    dragOffset.current = { x: e.clientX - freeStudentPanelPos.x, y: e.clientY - freeStudentPanelPos.y };
    e.stopPropagation(); e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingPanel.current) return;
      setFreeStudentPanelPos({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const onUp = () => { draggingPanel.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    const close = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [showDropdown]);

  const handleSelect = (student) => {
    addFreeStudent(student.id);
    setSearchQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="free-panel" style={{ left: freeStudentPanelPos.x, top: freeStudentPanelPos.y }}>
      {/* Title bar */}
      <div className="free-panel__title" onMouseDown={onTitleMouseDown}>
        <span>⭐ 自由 &amp; 🛡️ 保护</span>
        <button className="free-panel__collapse" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? "▾" : "▴"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* ── Free students section ── */}
          <div>
            <div className="free-panel__section-label">⭐ 自由学生 <span style={{fontWeight:400,color:"var(--text-muted)"}}>可重复放置任意槽</span></div>
            <div className="free-panel__grid">
              {freeStudents.length === 0 && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "2px 0" }}>暂无</div>
              )}
              {freeStudents.map(s => (
                <FreeCard key={s.id} student={s} onRemove={() => removeFreeStudent(s.id)} />
              ))}
            </div>
            {/* Name search to add */}
            <div style={{ position: "relative", marginTop: 5 }} ref={searchRef}>
              <input
                className="filter-input"
                style={{ width: "100%", fontSize: 11, padding: "4px 8px" }}
                placeholder="搜索学生名称添加…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && suggestions.length > 0 && (
                <div className="free-panel__dropdown">
                  {suggestions.map(s => (
                    <SuggestionRow key={s.id} student={s} onSelect={() => handleSelect(s)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* ── Protected slots section ── */}
          <div>
            <div className="free-panel__section-label">🛡️ 保护位 <span style={{fontWeight:400,color:"var(--text-muted)"}}>此处学生不可被禁用</span></div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
              {protectedSlots.map((student, i) => (
                <ProtectedSlot
                  key={i} idx={i} student={student}
                  onRemove={() => removeProtectedSlot(i)}
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ── Free card (draggable copy) ─────────────────────────────── */
function FreeCard({ student, onRemove }) {
  const { startDrag } = useDrag();
  const [imgError, setImgError] = useState(false);
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    startDrag(student, e, null);
  };
  return (
    <div className="free-card" onMouseDown={handleMouseDown} title={`拖拽放置 ${student.name}`}>
      {!imgError
        ? <img src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
               alt={student.name} onError={() => setImgError(true)} draggable={false} />
        : <div className="student-card__img-loading" style={{ width: 52, height: 52 }}>{student.id}</div>
      }
      <TypeIcons bulletType={student.bulletType} armorType={student.armorType} size={11} />
      <div className="free-card__name">{student.name}</div>
      <button className="avatar-slot__remove" style={{ display: "flex", top: 2, right: 2 }}
        title="移除" onMouseUp={(e) => { e.stopPropagation(); onRemove(); }}>×</button>
    </div>
  );
}

/* ── Suggestion row in dropdown ─────────────────────────────── */
function SuggestionRow({ student, onSelect }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="free-panel__suggestion" onMouseDown={(e) => { e.preventDefault(); onSelect(); }}>
      {!imgError
        ? <img src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
               alt={student.name} onError={() => setImgError(true)}
               style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
        : <div style={{ width: 28, height: 28, background: "var(--bg-card)", borderRadius: 4, flexShrink: 0 }} />
      }
      <span style={{ fontSize: 12 }}>{student.name}</span>
      <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>{student.id}</span>
    </div>
  );
}

/* ── Protected slot (inside floating panel) ─────────────────── */
function ProtectedSlot({ idx, student, onRemove }) {
  const { dragging, getCurrentDrag, startDrag, endDrag, consumeDrop } = useDrag();
  const { swapProtectedSlot } = useDraftStore();
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !student) return;
    e.preventDefault(); e.stopPropagation();
    startDrag(student, e, { kind: "protected", slotIdx: idx });
  };
  const handleMouseEnter = () => { if (dragging) setDragOver(true); };
  const handleMouseLeave = () => setDragOver(false);
  const handleMouseUp = () => {
    const cur = getCurrentDrag();
    if (cur && dragOver) {
      consumeDrop();
      swapProtectedSlot(idx, cur.student, cur.source);
      endDrag();
    }
    setDragOver(false);
  };

  return (
    <div
      className={["avatar-slot avatar-slot--pick avatar-slot--shared protected-slot",
        student ? "filled" : "", dragOver ? "drag-over" : "", student ? "slot-draggable" : ""].join(" ")}
      onMouseDown={handleMouseDown} onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp}
      title={student ? `${student.name}（受保护）` : "拖入学生设为保护"}
    >
      <span className="protected-badge">🛡</span>
      {student ? (
        <>
          {!imgError
            ? <img src={`https://schaledb.com/images/student/collection/${student.id}.webp`}
                   alt={student.name} onError={() => setImgError(true)} draggable={false} />
            : <div className="student-card__img-loading">{student.name}</div>
          }
          <TypeIcons bulletType={student.bulletType} armorType={student.armorType} size={12} />
          <div className="avatar-slot__label">{student.name}</div>
          <button className="avatar-slot__remove" title="从保护位移除"
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseUp={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}>×</button>
        </>
      ) : (
        <span className="avatar-slot__empty-icon">+</span>
      )}
    </div>
  );
}

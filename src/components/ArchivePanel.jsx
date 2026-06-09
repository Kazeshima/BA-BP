import { useState, useMemo } from "react";
import { useDraftStore } from "../store/draftStore";
import StudentCard from "./StudentCard";

export default function ArchivePanel() {
  const { students, archivedIds, archivePanelOpen, toggleArchivePanel } = useDraftStore();
  const [search, setSearch] = useState("");

  const archivedStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => {
      if (!archivedIds.has(s.id)) return false;
      if (q && !s.name.toLowerCase().includes(q) &&
               !(s.devName || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, archivedIds, search]);

  return (
    <>
      {/* Backdrop — stops 320px short of the right edge so it never covers the panel */}
      {archivePanelOpen && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, bottom: 0,
            right: 320,
            background: "#00000050",
            zIndex: 80,
          }}
          onClick={toggleArchivePanel}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="archive-panel"
        style={{ transform: archivePanelOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Pull tab on the left edge */}
        <button
          className="archive-tab"
          onClick={toggleArchivePanel}
          title={archivePanelOpen ? "关闭存档" : "打开存档"}
        >
          <span style={{ writingMode: "vertical-rl", letterSpacing: "0.1em" }}>
            📦 存档区
          </span>
        </button>

        {/* Panel body — flex column, fills panel height */}
        <div className="archive-panel__inner">
          <div className="archive-panel__header">
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-gold)" }}>
              存档管理
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
              右键可移出存档
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
              {archivedIds.size} 名
            </span>
          </div>

          <input
            className="filter-input"
            placeholder="搜索存档学生..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", marginBottom: 8, flexShrink: 0 }}
          />

          {/* Scrollable grid — use align-content: flex-start to pack cards tight */}
          <div
            className="student-grid"
            style={{
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
              alignContent: "flex-start",
            }}
          >
            {archivedStudents.length === 0 && (
              <div className="no-students">
                {archivedIds.size === 0
                  ? "存档为空。在主列表右键学生可移入存档。"
                  : "没有匹配的学生"}
              </div>
            )}
            {archivedStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                isBanned={false}
                isPicked={false}
                isArchived={true}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

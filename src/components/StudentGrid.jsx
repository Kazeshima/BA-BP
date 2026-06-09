import { useState, useMemo } from "react";
import { useDraftStore } from "../store/draftStore";
import StudentCard from "./StudentCard";

const SQUAD_TYPES = ["All", "Main", "Support"];
const ROLES = ["All", "DamageDealer", "Tanker", "Healer", "Vehicle", "Supporter"];
const ROLE_LABELS = {
  DamageDealer: "输出", Tanker: "坦克", Healer: "治愈", Vehicle: "T.S", Supporter: "辅助",
};

// What the hide dropdown affects
const HIDE_OPTIONS = [
  { value: "none",   label: "全部显示" },
  { value: "banned", label: "隐藏已禁" },
  { value: "picked", label: "隐藏已选" },
  { value: "both",   label: "隐藏已禁+已选" },
];

export default function StudentGrid() {
  const { students, archivedIds } = useDraftStore();
  const bannedIds = useDraftStore(s => s.getBannedIds());
  const pickedIds = useDraftStore(s => s.getPickedIds());

  const [search,      setSearch]      = useState("");
  const [squadFilter, setSquadFilter] = useState("All");
  const [roleFilter,  setRoleFilter]  = useState("All");
  const [hideMode,    setHideMode]    = useState("none");  // "none"|"banned"|"picked"|"both"
  const [hideOn,      setHideOn]      = useState(false);   // toggle

  const activeStudents = useMemo(
    () => students.filter(s => !archivedIds.has(s.id)),
    [students, archivedIds]
  );

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return activeStudents.filter(s => {
      // Text search
      if (q && !s.name.toLowerCase().includes(q) &&
               !String(s.id).includes(q) &&
               !(s.devName || "").toLowerCase().includes(q)) return false;
      // Squad type filter
      if (squadFilter === "Main"    && s.squadType  !== "Main")    return false;
      if (squadFilter === "Support" && s.squadType  !== "Support") return false;
      // Role filter
      if (roleFilter !== "All" && s.tacticRole !== roleFilter)     return false;
      // Hide filter
      if (hideOn) {
        const hideBanned = hideMode === "banned" || hideMode === "both";
        const hidePicked = hideMode === "picked" || hideMode === "both";
        if (hideBanned && bannedIds.has(s.id)) return false;
        if (hidePicked && pickedIds.has(s.id)) return false;
      }
      return true;
    });
  }, [activeStudents, search, squadFilter, roleFilter, hideOn, hideMode, bannedIds, pickedIds]);

  const hiddenCount = activeStudents.length - visible.length;

  return (
    <div className="grid-zone">
      {/* ── Filter bar ── */}
      <div className="grid-zone__filters">
        <input
          className="filter-input"
          placeholder="搜索学生名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {SQUAD_TYPES.map(t => (
          <button key={t}
            className={`filter-btn ${squadFilter === t ? "active" : ""}`}
            onClick={() => setSquadFilter(t)}
          >
            {t === "All" ? "全部" : t === "Main" ? "主力" : "后援"}
          </button>
        ))}

        <span style={{ color: "var(--border-bright)", margin: "0 2px" }}>|</span>

        {ROLES.map(r => (
          <button key={r}
            className={`filter-btn ${roleFilter === r ? "active" : ""}`}
            onClick={() => setRoleFilter(r)}
          >
            {r === "All" ? "全职" : ROLE_LABELS[r] || r}
          </button>
        ))}

        <span style={{ color: "var(--border-bright)", margin: "0 2px" }}>|</span>

        {/* Hide filter dropdown */}
        <select
          className="lang-select"
          value={hideMode}
          onChange={e => setHideMode(e.target.value)}
          title="选择要隐藏的学生类型"
          disabled={hideMode === "none" ? false : false}
        >
          {HIDE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Toggle hide on/off — only active if a mode is selected */}
        <button
          className={`btn ${hideOn && hideMode !== "none" ? "btn-primary" : "btn-ghost"}`}
          style={hideOn && hideMode !== "none"
            ? { background: "#0e2236", borderColor: "var(--accent-blue)", fontSize: 12, padding: "4px 10px" }
            : { fontSize: 12, padding: "4px 10px" }}
          onClick={() => {
            if (hideMode === "none") return; // no-op if "全部显示" is selected
            setHideOn(h => !h);
          }}
          title={hideMode === "none" ? "请先选择隐藏类型" : hideOn ? "点击取消隐藏" : "点击开启隐藏"}
        >
          {hideOn && hideMode !== "none" ? "👁 已隐藏" : "👁 隐藏"}
        </button>

        <span style={{ color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          {visible.length} / {activeStudents.length}
          {hideOn && hiddenCount > 0 && (
            <span style={{ color: "var(--accent-blue)", marginLeft: 4 }}>(-{hiddenCount})</span>
          )}
        </span>
      </div>

      {/* ── Student grid ── */}
      <div className="student-grid">
        {visible.length === 0 && (
          <div className="no-students">
            {hideOn && hiddenCount > 0
              ? `已隐藏 ${hiddenCount} 名学生 — 点击"👁 已隐藏"取消`
              : "没有找到匹配的学生"}
          </div>
        )}
        {visible.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            isBanned={bannedIds.has(student.id)}
            isPicked={pickedIds.has(student.id)}
          />
        ))}
      </div>
    </div>
  );
}

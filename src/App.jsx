import { useEffect } from "react";
import { useDraftStore } from "./store/draftStore";
import { DragProvider } from "./hooks/useDragContext";
import BanZone from "./components/BanZone";
import StudentGrid from "./components/StudentGrid";
import PickZone from "./components/PickZone";
import ResetModal from "./components/ResetModal";
import ArchivePanel from "./components/ArchivePanel";
import FreeStudentPanel from "./components/FreeStudentPanel";

const LANG_URLS = {
  zh: "https://schaledb.com/data/zh/students.json",
  cn: "https://schaledb.com/data/cn/students.json",
  tw: "https://schaledb.com/data/tw/students.json",
  jp: "https://schaledb.com/data/jp/students.json",
  en: "https://schaledb.com/data/en/students.json",
};
const LANG_LABELS = {
  zh: "简中（民译）", cn: "简中（国服）", tw: "繁中", jp: "日本語", en: "English",
};

function parseStudents(raw) {
  return Object.values(raw)
    .filter(s => s.IsReleased?.[0] === true)
    .map(s => ({
      id: s.Id, name: s.Name || s.DevName, devName: s.DevName,
      school: s.School, squadType: s.SquadType, tacticRole: s.TacticRole, starGrade: s.StarGrade,
      bulletType: s.BulletType, armorType: s.ArmorType,
    }))
    .sort((a, b) => a.id - b.id);
}

export default function App() {
  const {
    loading, error, language,
    setStudents, setError, setLanguage,
    openResetModal, openPartialResetModal,
    releaseMode, toggleReleaseMode, releaseModeBlockedWarning,
    archivePanelOpen, toggleArchivePanel,
    sideBanCount, sharedBanCount, setSideBanCount, setSharedBanCount,
  } = useDraftStore();

  useEffect(() => {
    const url = LANG_URLS[language] || LANG_URLS.zh;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => setStudents(parseStudents(data)))
      .catch(e => setError(e.message));
  }, [language]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">LOADING STUDENT DATA…</div>
    </div>
  );

  if (error) return (
    <div className="loading-screen">
      <div style={{ color: "var(--accent-red)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
        数据加载失败：{error}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
        请检查网络连接后刷新页面
      </div>
    </div>
  );

  return (
    <DragProvider>
      <div
        className="app-root"
        style={{ position: "relative", overflow: "hidden" }}
        data-release={releaseMode ? "true" : "false"}
      >
        {/* ── Header ── */}
        <header className="app-header">
          <div className="app-header__logo">
            Blue Archive <span>·</span> Draft Tool
          </div>
          <div className="app-header__controls">

            <select className="lang-select" value={language}
              onChange={e => setLanguage(e.target.value)} title="切换学生名称语言">
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>

            <div style={{ width: 1, height: 18, background: "var(--border)" }} />

            {/* Ban slot count controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>禁用:</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>各</span>
              <input type="number" min={0} max={10} value={sideBanCount}
                onChange={e => setSideBanCount(parseInt(e.target.value) || 0)}
                className="timer-input" style={{ width: 38 }} title="每方禁用槽数量" />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>共</span>
              <input type="number" min={0} max={80} value={sharedBanCount}
                onChange={e => setSharedBanCount(parseInt(e.target.value) || 0)}
                className="timer-input" style={{ width: 42 }} title="共享禁用槽数量（最多80）" />
            </div>

            <div style={{ width: 1, height: 18, background: "var(--border)" }} />

            {/* Release mode */}
            <button
              className={`btn ${releaseMode ? "btn-primary" : "btn-ghost"} ${releaseModeBlockedWarning ? "release-blocked-flash" : ""}`}
              style={releaseMode ? {
                background:  releaseModeBlockedWarning ? "#7f1d1d" : "#5b21b6",
                borderColor: releaseModeBlockedWarning ? "#ef4444" : "#a855f7",
                transition: "background 0.2s, border-color 0.2s",
              } : {}}
              onClick={toggleReleaseMode}
              title={releaseModeBlockedWarning
                ? "⚠️ 无法退出：当前阵容在正常规则下不合法"
                : releaseMode ? "特殊规则已开启 — 点击退出" : "特殊规则：开启后可将任意学生放入任意槽"}
            >
              {releaseModeBlockedWarning ? "⚠️ 无法退出" : releaseMode ? "🔓 特殊规则 ON" : "🔒 特殊规则"}
            </button>

            {/* Archive */}
            <button className={`btn btn-ghost ${archivePanelOpen ? "active" : ""}`}
              onClick={toggleArchivePanel} title="存档管理">
              📦 存档
            </button>

            {/* Partial reset */}
            <button className="btn btn-ghost" onClick={openPartialResetModal}
              title="局间重置：清除各方独立禁用和阵容，保留共享禁用和比分">
              ↺ 局间
            </button>

            {/* Full reset */}
            <button className="btn btn-danger" onClick={openResetModal}>
              ↺ 重置
            </button>
          </div>
        </header>

        {/* ── Ban zone ── */}
        <BanZone />

        {/* ── Student grid ── */}
        <StudentGrid />

        {/* ── Pick zone ── */}
        <PickZone />

        {/* ── Floating panels ── */}
        <FreeStudentPanel />
        <ArchivePanel />
      </div>

      <ResetModal />
    </DragProvider>
  );
}

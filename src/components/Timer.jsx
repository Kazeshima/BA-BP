import { useDraftStore } from "../store/draftStore";

export default function Timer() {
  const {
    timerSeconds, timerInput, timerRunning,
    setTimerInput, startTimer, stopTimer, resetTimer,
  } = useDraftStore();

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  let timerClass = "timer-display";
  if (timerSeconds <= 10 && timerSeconds > 0) timerClass += " danger";
  else if (timerSeconds <= 30) timerClass += " warning";

  return (
    <div className="center-panel">
      <div className="section-label" style={{ textAlign: "center" }}>选择计时</div>

      <div className={timerClass}>{display}</div>

      <div className="timer-controls">
        <input
          className="timer-input"
          type="number"
          min={1}
          max={999}
          value={timerInput}
          onChange={e => setTimerInput(e.target.value)}
          title="设定时间 (秒)"
        />
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>秒</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          className={`btn ${timerRunning ? "btn-danger" : "btn-primary"}`}
          onClick={timerRunning ? stopTimer : startTimer}
        >
          {timerRunning ? "⏹ 暂停" : "▶ 开始"}
        </button>
        <button className="btn btn-ghost" onClick={resetTimer} title="重置计时">
          ↺
        </button>
      </div>
    </div>
  );
}

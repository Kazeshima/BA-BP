import { useDraftStore } from "../store/draftStore";

export default function ScoreBox({ side }) {
  const isAttacker = side === "attacker";
  const score    = useDraftStore(s => isAttacker ? s.attackerScore : s.defenderScore);
  const setScore = useDraftStore(s => isAttacker ? s.setAttackerScore : s.setDefenderScore);

  const isTwoDigit = score >= 10;
  const accentColor = isAttacker ? "var(--attacker-color)" : "var(--defender-color)";

  return (
    <div className="score-box-wrapper">
      <div className="section-label" style={{ textAlign: "center", marginBottom: 4 }}>
        比分
      </div>
      <input
        className="score-box"
        type="number"
        min={0}
        max={99}
        value={score}
        onChange={e => setScore(e.target.value)}
        style={{
          borderColor: accentColor,
          color: accentColor,
          // Shrink font slightly for 2-digit numbers to keep box compact
          fontSize: isTwoDigit ? "28px" : "38px",
          width: isTwoDigit ? "62px" : "62px",
        }}
        title="比分（点击编辑）"
      />
    </div>
  );
}

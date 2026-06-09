import PlayerPanel from "./PlayerPanel";
import Timer from "./Timer";
import ScoreBox from "./ScoreBox";
import { useDraftStore } from "../store/draftStore";

export default function PickZone() {
  const { swapPlayers } = useDraftStore();
  return (
    <div className="pick-zone">
      <PlayerPanel side="attacker" />
      <ScoreBox side="attacker" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Timer />
        <button className="btn btn-swap" onClick={swapPlayers} title="交换双方身份">⇄</button>
      </div>
      <ScoreBox side="defender" />
      <PlayerPanel side="defender" />
    </div>
  );
}

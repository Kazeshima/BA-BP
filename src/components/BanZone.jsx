import { useEffect, useState } from "react";
import AvatarSlot from "./AvatarSlot";
import { useDraftStore } from "../store/draftStore";

// Split array into rows of at most maxPerRow
function splitIntoRows(arr, maxPerRow) {
  if (arr.length <= maxPerRow) return [arr];
  const rows = [];
  for (let i = 0; i < arr.length; i += maxPerRow) {
    rows.push(arr.slice(i, i + maxPerRow));
  }
  return rows;
}

function useContainerWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

// Fixed slot size for shared bans — never shrinks below this
const SHARED_FIXED_SIZE = 44;
// Max slots per row before adding another row (at fixed size)
const MAX_PER_ROW = 20;

export default function BanZone() {
  const {
    attackerBans, defenderBans, sharedBans,
    sideBanCount, sharedBanCount,
    banStudentToSlot, removeBan,
  } = useDraftStore();

  const containerWidth = useContainerWidth();
  const hasShared = sharedBanCount > 0;
  const hasSide   = sideBanCount   > 0;

  // Side slots: always one row, shrink to fit
  const sideAvailable = hasShared
    ? (containerWidth - 80) / 3
    : (containerWidth - 60) / 2;
  const sideSize = sideBanCount === 0 ? 60
    : Math.max(28, Math.min(60, Math.floor((sideAvailable - sideBanCount * 4) / sideBanCount)));
  const sideStyle = { width: sideSize, height: sideSize };

  // Shared slots:
  // ≤ 40 → split into at most 2 rows, shrink to fit horizontally
  // > 40 → fixed size (SHARED_FIXED_SIZE), split into as many rows as needed (max 20/row)
  const useFixedSize = sharedBanCount > 40;
  let sharedRows;
  let sharedSlotSize;

  if (useFixedSize) {
    sharedRows     = splitIntoRows(sharedBans, MAX_PER_ROW);
    sharedSlotSize = SHARED_FIXED_SIZE;
  } else {
    // 1 or 2 rows
    const numRows     = sharedBanCount > 20 ? 2 : 1;
    const slotsPerRow = Math.ceil(sharedBanCount / numRows);
    const sharedAvail = hasShared ? (containerWidth - 80) / 3 : 0;
    sharedSlotSize    = sharedBanCount === 0 ? 60
      : Math.max(28, Math.min(60, Math.floor((sharedAvail - slotsPerRow * 4) / slotsPerRow)));
    sharedRows        = splitIntoRows(sharedBans, slotsPerRow);
  }
  const sharedStyle = { width: sharedSlotSize, height: sharedSlotSize };

  const renderBanRow = (slots, side, startIdx, style) =>
    slots.map((student, i) => (
      <AvatarSlot
        key={startIdx + i}
        slotType="ban" side={side} slotIdx={startIdx + i}
        student={student} sizeOverride={style}
        onRemove={() => removeBan(side, startIdx + i)}
        onDrop={(s) => banStudentToSlot(side, startIdx + i, s)}
      />
    ));

  return (
    <div className="ban-zone" style={{
      gridTemplateColumns: hasShared ? "1fr auto 1fr" : "1fr 1fr",
    }}>
      {/* ── Attacker bans ── */}
      <div>
        <div className="side-header side-header--attacker">
          <span className="side-header__dot" />攻击方 · 禁用
        </div>
        <div className="ban-slots ban-slots--left">
          {!hasSide
            ? <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
            : renderBanRow(attackerBans, "attacker", 0, sideStyle)}
        </div>
      </div>

      {/* ── Shared bans (multi-row) ── */}
      {hasShared && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div className="section-label" style={{ textAlign: "center" }}>共享禁用</div>
          {sharedRows.map((row, rowIdx) => {
            const startIdx = sharedRows.slice(0, rowIdx).reduce((s, r) => s + r.length, 0);
            return (
              <div key={rowIdx} className="ban-slots" style={{ justifyContent: "center" }}>
                {renderBanRow(row, "shared", startIdx, sharedStyle)}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Defender bans ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div className="side-header side-header--defender">
          防守方 · 禁用<span className="side-header__dot" />
        </div>
        <div className="ban-slots ban-slots--right">
          {!hasSide
            ? <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
            : renderBanRow(defenderBans, "defender", 0, sideStyle)}
        </div>
      </div>
    </div>
  );
}

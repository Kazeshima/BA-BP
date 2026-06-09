import { useRef } from "react";
import AvatarSlot from "./AvatarSlot";
import { useDraftStore } from "../store/draftStore";

export default function PlayerPanel({ side }) {
  const isAttacker = side === "attacker";
  const {
    attackerName, defenderName,
    attackerAvatarUrl, defenderAvatarUrl,
    setAttackerName, setDefenderName,
    setAttackerAvatarUrl, setDefenderAvatarUrl,
    attackerPicks, defenderPicks,
    pickStudentToSlot, pickStudentToSlotCross, removePick,
    releaseMode, genericMode, toggleGenericMode,
    freeStudentIds,
  } = useDraftStore();

  const isGeneric  = genericMode[side];
  const name       = isAttacker ? attackerName       : defenderName;
  const avatarUrl  = isAttacker ? attackerAvatarUrl  : defenderAvatarUrl;
  const setName    = isAttacker ? setAttackerName     : setDefenderName;
  const setAvatar  = isAttacker ? setAttackerAvatarUrl : setDefenderAvatarUrl;
  const picks      = isAttacker ? attackerPicks       : defenderPicks;
  const accentColor = isAttacker ? "var(--attacker-color)" : "var(--defender-color)";

  const fileInputRef = useRef(null);

  const handleAvatarFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setAvatar(URL.createObjectURL(f));
  };
  const handleAvatarFileDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0]; if (!f) return;
    setAvatar(URL.createObjectURL(f));
  };

  // Build drop handler for a pick slot
  const makeDropHandler = (slotType, slotIdx) => (student, source) => {
    const isFree = freeStudentIds.has(student.id);

    // Squad-type enforcement (bypassed in release mode, generic mode, or free students)
    if (!releaseMode && !isGeneric && !isFree) {
      if (slotType === "main"    && student.id >= 20000) return;
      if (slotType === "support" && student.id <  20000) return;
    }

    if (source && source.kind === "pick") {
      if (source.side === side) {
        // Same-side reorder → swap
        pickStudentToSlot(side, slotType, slotIdx, student, source);
      } else {
        // Cross-side drag → clear source, place in target
        pickStudentToSlotCross(side, slotType, slotIdx, student, source);
      }
    } else {
      // From student grid or free panel
      pickStudentToSlot(side, slotType, slotIdx, student, null);
    }
  };

  // Render slots
  const renderSlots = () => {
    if (isGeneric) {
      // 6 generic slots — all use slotType "main" internally
      return (
        <div className="team-slots-row">
          {picks.main.map((student, i) => (
            <AvatarSlot
              key={i}
              slotType="pick"
              side={side}
              slotSubType="main"
              slotIdx={i}
              student={student}
              onRemove={() => removePick(side, "main", i)}
              onDrop={makeDropHandler("main", i)}
            />
          ))}
        </div>
      );
    }
    // Normal 4+2 mode
    return (
      <div className="team-slots-row">
        {picks.main.map((student, i) => (
          <AvatarSlot
            key={`m${i}`}
            slotType="pick"
            side={side}
            slotSubType="main"
            slotIdx={i}
            student={student}
            showTypeTag
            onRemove={() => removePick(side, "main", i)}
            onDrop={makeDropHandler("main", i)}
          />
        ))}
        <div className="team-slots-divider" />
        {picks.support.map((student, i) => (
          <AvatarSlot
            key={`s${i}`}
            slotType="pick"
            side={side}
            slotSubType="support"
            slotIdx={i}
            student={student}
            showTypeTag
            onRemove={() => removePick(side, "support", i)}
            onDrop={makeDropHandler("support", i)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="team-panel">
      {/* Player identity */}
      <div className="team-panel__player">
        <div
          className="player-avatar-drop"
          style={{ borderColor: accentColor }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleAvatarFileDrop}
          onDragOver={e => e.preventDefault()}
          title="点击或拖拽图片设置头像"
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="player" />
            : <span className="player-avatar-drop__icon">👤</span>
          }
          <input ref={fileInputRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={handleAvatarFile} />
        </div>
        <input
          className="player-name-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isAttacker ? "攻击方玩家" : "防守方玩家"}
          style={{ borderColor: `${accentColor}40` }}
        />
      </div>

      {/* Pick slots header with generic mode toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div className={`side-header side-header--${isAttacker ? "attacker" : "defender"}`}>
          <span className="side-header__dot" />
          {isAttacker ? "攻击方" : "防守方"} · 出战
        </div>
        <button
          className={`filter-btn ${isGeneric ? "active" : ""}`}
          style={{ fontSize: 10, padding: "2px 6px", marginLeft: "auto" }}
          onClick={() => toggleGenericMode(side)}
          title={isGeneric ? "切换回 4主+2援 模式" : "切换到 6通用 模式"}
        >
          {isGeneric ? "6通用" : "4+2"}
        </button>
      </div>

      {renderSlots()}
    </div>
  );
}

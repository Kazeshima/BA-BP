/**
 * Attack / Defense type icon overlays.
 *
 * Color mapping:
 *   Explosion  / LightArmor   → red     #ef4444
 *   Pierce     / HeavyArmor   → yellow  #f0b429
 *   Mystic     / Unarmed      → blue    #38bdf8
 *   Sonic      / ElasticArmor → purple  #a855f7
 *   Chemical   / Composite    → green   #22c55e
 *
 * Each icon is a white PNG (transparent bg) from SchaleDB.
 * We place it over a solid-color circle so it reads clearly
 * regardless of the student avatar behind it.
 */

const TYPE_COLORS = {
  // Bullet types
  Explosion:   "#ef4444",
  Pierce:      "#f0b429",
  Mystic:      "#38bdf8",
  Sonic:       "#a855f7",
  Chemical:    "#22c55e",
  // Armor types
  LightArmor:  "#ef4444",
  HeavyArmor:  "#f0b429",
  Unarmed:     "#38bdf8",
  ElasticArmor:"#a855f7",
  Composite:   "#22c55e",
};

const ATTACK_ICON  = "https://schaledb.com/images/ui/Type_Attack_s.png";
const DEFENSE_ICON = "https://schaledb.com/images/ui/Type_Defense_s.png";

/**
 * size: diameter of each circle badge in px (default 15)
 */
export default function TypeIcons({ bulletType, armorType, size = 15 }) {
  if (!bulletType && !armorType) return null;

  const attackColor  = TYPE_COLORS[bulletType]  || "#666";
  const defenseColor = TYPE_COLORS[armorType]   || "#666";

  return (
    <div style={{
      position:      "absolute",
      top:           2,
      left:          2,
      display:       "flex",
      flexDirection: "column",
      gap:           2,
      zIndex:        4,
      pointerEvents: "none",
    }}>
      <TypeBadge icon={ATTACK_ICON}  color={attackColor}  size={size} alt={bulletType} />
      <TypeBadge icon={DEFENSE_ICON} color={defenseColor} size={size} alt={armorType}  />
    </div>
  );
}

function TypeBadge({ icon, color, size, alt }) {
  const iconSize = Math.round(size * 0.72); // icon slightly smaller than circle
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   "50%",
      background:     color,
      boxShadow:      "0 1px 3px #00000080",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexShrink:     0,
      overflow:       "hidden",
    }}>
      <img
        src={icon}
        alt={alt}
        draggable={false}
        style={{
          width:  iconSize,
          height: iconSize,
          display: "block",
          // PNG is white — render it white on the colored circle
          filter: "brightness(0) invert(1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

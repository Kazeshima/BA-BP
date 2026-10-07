import { Crosshair, Shield } from "lucide-react";
import { memo } from "react";
import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/zh";

/** In-game colour coding: red / yellow / blue / purple / green. */
export const TYPE_COLORS: Record<string, string> = {
  Explosion: "#e5484d",
  Pierce: "#e8a10b",
  Mystic: "#2f8fe6",
  Sonic: "#9b5de5",
  Chemical: "#2fa36b",
  LightArmor: "#e5484d",
  HeavyArmor: "#e8a10b",
  Unarmed: "#2f8fe6",
  ElasticArmor: "#9b5de5",
  CompositeArmor: "#2fa36b",
};

export const BULLET_TYPES = ["Explosion", "Pierce", "Mystic", "Sonic"] as const;
export const ARMOR_TYPES = ["LightArmor", "HeavyArmor", "Unarmed", "ElasticArmor", "CompositeArmor"] as const;

function Badge({ kind, type, size }: { kind: "bullet" | "armor"; type: string; size: number }) {
  const t = useT();
  const Icon = kind === "bullet" ? Crosshair : Shield;
  const label = t(`${kind}.${type}` as MessageKey);
  return (
    <span
      className="grid place-items-center rounded-full text-white shadow-[0_1px_3px_rgb(0_0_0/0.5)]"
      style={{ width: size, height: size, background: TYPE_COLORS[type] ?? "#6b7280" }}
      title={label}
    >
      <Icon strokeWidth={3} style={{ width: size * 0.62, height: size * 0.62 }} aria-label={label} />
    </span>
  );
}

export const TypeBadges = memo(function TypeBadges({
  bullet,
  armor,
  size = 15,
}: {
  bullet: string;
  armor: string;
  size?: number;
}) {
  if (!bullet && !armor) return null;
  return (
    <div className="pointer-events-none absolute top-[3px] left-[3px] z-[4] flex flex-col gap-[2px]">
      {bullet && <Badge kind="bullet" type={bullet} size={size} />}
      {armor && <Badge kind="armor" type={armor} size={size} />}
    </div>
  );
});

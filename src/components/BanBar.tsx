import type { CSSProperties } from "react";
import { useInvalidSlots } from "../hooks/useBoard";
import { useT } from "../i18n";
import { slotKey } from "../lib/rules";
import { useDraft } from "../store/draft";
import type { BanSide, SlotRef } from "../types";
import { Slot } from "./Slot";

/** Shared-ban grid columns: one row up to 20, two rows up to 40, then 20 per row. */
const sharedColumns = (n: number) => (n <= 20 ? n : n <= 40 ? Math.ceil(n / 2) : 20);

function BanRow({ side, align }: { side: Exclude<BanSide, "shared">; align: "start" | "end" }) {
  const t = useT();
  const count = useDraft((s) => s.board.bans[side].length);
  const filled = useDraft((s) => s.board.bans[side].filter((x) => x != null).length);
  const invalid = useInvalidSlots();
  const color = side === "attacker" ? "var(--atk)" : "var(--def)";

  return (
    <section className={`flex min-w-0 flex-col gap-2 ${align === "end" ? "items-end" : "items-start"}`}>
      <div className={`flex items-center gap-2 ${align === "end" ? "flex-row-reverse" : ""}`}>
        <span className="eyebrow" style={{ "--eyebrow-color": color } as CSSProperties}>
          {t(`side.${side}`)} · {t("ban.title")}
        </span>
        <span className="font-mono text-subtle text-xs">
          {filled}/{count}
        </span>
      </div>
      {count === 0 ? (
        <div className="grid h-14 place-items-center px-4 text-subtle">—</div>
      ) : (
        <div
          className={`grid w-full gap-1.5 ${align === "end" ? "justify-end" : "justify-start"}`}
          style={{ gridTemplateColumns: `repeat(${count}, minmax(28px, 60px))` }}
        >
          {Array.from({ length: count }, (_, index) => {
            const slot: SlotRef = { zone: "ban", side, index };
            return <Slot key={index} slot={slot} invalid={invalid.has(slotKey(slot))} compact={count > 7} />;
          })}
        </div>
      )}
    </section>
  );
}

function SharedBans() {
  const t = useT();
  const count = useDraft((s) => s.board.bans.shared.length);
  const filled = useDraft((s) => s.board.bans.shared.filter((x) => x != null).length);
  const invalid = useInvalidSlots();
  const cols = sharedColumns(count);

  return (
    <section className="flex min-w-0 flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="eyebrow" style={{ "--eyebrow-color": "var(--gold)" } as CSSProperties}>
          {t("side.shared")}
        </span>
        <span className="font-mono text-subtle text-xs">
          {filled}/{count}
        </span>
      </div>
      <div
        className="grid max-h-[176px] w-full justify-center gap-1 overflow-y-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(26px, ${count > 20 ? 40 : 52}px))` }}
      >
        {Array.from({ length: count }, (_, index) => {
          const slot: SlotRef = { zone: "ban", side: "shared", index };
          return <Slot key={index} slot={slot} invalid={invalid.has(slotKey(slot))} compact />;
        })}
      </div>
    </section>
  );
}

export function BanBar() {
  const hasShared = useDraft((s) => s.board.bans.shared.length > 0);
  return (
    <div
      className="panel grid items-start gap-4 px-4 py-3"
      style={{ gridTemplateColumns: hasShared ? "minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)" : "1fr 1fr" }}
    >
      <BanRow side="attacker" align="start" />
      {hasShared && <SharedBans />}
      <BanRow side="defender" align="end" />
    </div>
  );
}

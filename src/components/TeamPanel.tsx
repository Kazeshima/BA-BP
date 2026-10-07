import clsx from "clsx";
import { ImagePlus, UserRound, X } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";
import { toast } from "sonner";
import { useInvalidSlots } from "../hooks/useBoard";
import { useT } from "../i18n";
import { fileToAvatar } from "../lib/avatar";
import { slotKey } from "../lib/rules";
import { useDraft } from "../store/draft";
import { useSettings } from "../store/settings";
import { MAIN_SLOTS, PICK_SLOTS, type Side, type SlotRef } from "../types";
import { Slot } from "./Slot";

function PlayerAvatar({ side }: { side: Side }) {
  const t = useT();
  const avatar = useDraft((s) => s.players[side].avatar);
  const setPlayer = useDraft((s) => s.setPlayer);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPlayer(side, { avatar: await fileToAvatar(file) });
    } catch {
      toast.error(t("player.avatar"));
    }
  };

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        className={clsx(
          "grid size-14 place-items-center overflow-hidden rounded-full border-[3px] bg-surface-2 transition-transform hover:scale-105",
          over && "scale-110",
        )}
        style={{ borderColor: "var(--side-color)" }}
        title={t("player.avatar")}
        aria-label={t("player.avatar")}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void accept(e.dataTransfer.files[0]);
        }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="size-full object-cover" draggable={false} />
        ) : (
          <>
            <UserRound className="text-subtle group-hover:hidden" size={26} />
            <ImagePlus className="hidden text-[var(--side-color)] group-hover:block" size={22} />
          </>
        )}
      </button>
      {avatar && (
        <button
          type="button"
          className="absolute -top-1 -right-1 hidden size-5 place-items-center rounded-full bg-ban text-white group-hover:grid"
          title={t("player.avatarClear")}
          aria-label={t("player.avatarClear")}
          onClick={() => setPlayer(side, { avatar: null })}
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function TeamPanel({ side }: { side: Side }) {
  const t = useT();
  const name = useDraft((s) => s.players[side].name);
  const setPlayer = useDraft((s) => s.setPlayer);
  const setGeneric = useDraft((s) => s.setGeneric);
  const generic = useSettings((s) => s.generic[side]);
  const invalid = useInvalidSlots();
  const mirrored = side === "defender";
  const color = side === "attacker" ? "var(--atk)" : "var(--def)";

  const toggleMode = () => {
    if (setGeneric(side, !generic)) toast(t("generic.rearranged"), { id: `generic-${side}` });
  };

  const slots = Array.from({ length: PICK_SLOTS }, (_, index): SlotRef => ({ zone: "pick", side, index }));
  // null marks the divider between main and support slots in 4+2 mode.
  const ordered: (SlotRef | null)[] = generic
    ? slots
    : [...slots.slice(0, MAIN_SLOTS), null, ...slots.slice(MAIN_SLOTS)];
  const layout = mirrored ? [...ordered].reverse() : ordered;
  const columns = layout.map((slot) => (slot ? "minmax(0, 84px)" : "10px"));
  const renderSlot = (slot: SlotRef) => (
    <Slot key={slotKey(slot)} slot={slot} invalid={invalid.has(slotKey(slot))} />
  );

  return (
    <section
      className="panel flex min-w-0 flex-col justify-center gap-2.5 px-4 py-3"
      style={{ "--side-color": color, borderTop: `3px solid ${color}` } as CSSProperties}
    >
      <div className={clsx("flex items-center gap-3", mirrored && "flex-row-reverse")}>
        <PlayerAvatar side={side} />
        <div className={clsx("flex min-w-0 flex-1 flex-col gap-1", mirrored && "items-end")}>
          <span className="eyebrow" style={{ "--eyebrow-color": color } as CSSProperties}>
            {t(`side.${side}`)} · {t("pick.title")}
          </span>
          <input
            className={clsx("input h-9 w-full max-w-64 font-bold text-base", mirrored && "text-right")}
            value={name}
            maxLength={40}
            placeholder={t(`side.${side}`)}
            onChange={(e) => setPlayer(side, { name: e.target.value })}
            aria-label={`${t(`side.${side}`)} ${t("player.namePlaceholder")}`}
          />
        </div>
        <button
          type="button"
          className="chip shrink-0 self-end"
          onClick={toggleMode}
          title={generic ? t("pick.mode.toFourTwo") : t("pick.mode.toGeneric")}
        >
          {generic ? t("pick.mode.generic") : t("pick.mode.fourTwo")}
        </button>
      </div>

      {/* The defender's slots are mirrored so both teams read outward from the centre. */}
      <div
        className="grid items-center gap-1.5"
        style={{ gridTemplateColumns: columns.join(" "), justifyContent: mirrored ? "end" : "start" }}
      >
        {layout.map((slot) =>
          slot ? (
            renderSlot(slot)
          ) : (
            <span key="divider" className="mx-auto h-3/5 w-0.5 rounded bg-line-strong" aria-hidden />
          ),
        )}
      </div>
    </section>
  );
}

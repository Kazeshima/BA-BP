import clsx from "clsx";
import { ArrowLeftRight, Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { alarm, tick } from "../lib/sound";
import { useDraft } from "../store/draft";
import { useSettings } from "../store/settings";
import { formatClock, useTimer } from "../store/timer";
import type { Side } from "../types";

function Score({ side }: { side: Side }) {
  const t = useT();
  const score = useDraft((s) => s.players[side].score);
  const setPlayer = useDraft((s) => s.setPlayer);
  const set = (n: number) => setPlayer(side, { score: Math.max(0, Math.min(99, Math.round(n) || 0)) });
  const color = side === "attacker" ? "var(--atk)" : "var(--def)";
  const stepper =
    "grid h-[26px] w-6 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-3 hover:text-[var(--c)]";

  return (
    <div
      className={clsx("flex items-center gap-0.5", side === "defender" && "flex-row-reverse")}
      style={{ "--c": color } as CSSProperties}
    >
      <div className="flex flex-col gap-1">
        <button
          type="button"
          className={stepper}
          onClick={() => set(score + 1)}
          aria-label={`${t(`side.${side}`)} ${t("score.inc")}`}
          title={t("score.inc")}
        >
          <Plus size={14} strokeWidth={3} />
        </button>
        <button
          type="button"
          className={stepper}
          onClick={() => set(score - 1)}
          aria-label={`${t(`side.${side}`)} ${t("score.dec")}`}
          title={t("score.dec")}
        >
          <Minus size={14} strokeWidth={3} />
        </button>
      </div>
      <input
        type="number"
        min={0}
        max={99}
        value={score}
        onChange={(e) => set(Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        className="h-14 w-16 rounded-xl border-2 bg-surface-2 text-center font-bold font-mono text-[40px] leading-none outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--c)_25%,transparent)]"
        style={{ borderColor: color, color }}
        aria-label={`${t(`side.${side}`)} ${t("score.label")}`}
      />
    </div>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function Timer() {
  const t = useT();
  const status = useTimer((s) => s.status);
  const endsAt = useTimer((s) => s.endsAt);
  const remainingMs = useTimer((s) => s.remainingMs);
  const { toggle, reset, finish, setDuration } = useTimer.getState();
  const duration = useSettings((s) => s.timerDuration);
  const sound = useSettings((s) => s.sound);
  const now = useNow(status === "running");
  const remaining = status === "running" && endsAt != null ? Math.max(0, endsAt - now) : remainingMs;
  const seconds = Math.ceil(remaining / 1000);
  const lastBeep = useRef<number | null>(null);
  const [draft, setDraft] = useState(String(duration));

  useEffect(() => setDraft(String(duration)), [duration]);

  // Countdown side effects: beep for the last five seconds, alarm at zero.
  useEffect(() => {
    if (status !== "running") {
      lastBeep.current = null;
      return;
    }
    if (remaining <= 0) {
      finish();
      if (sound) alarm();
      return;
    }
    if (seconds <= 5 && lastBeep.current !== seconds) {
      lastBeep.current = seconds;
      if (sound) tick();
    }
  }, [status, remaining, seconds, sound, finish]);

  const danger = status !== "idle" && seconds <= 10;
  const warning = status !== "idle" && seconds <= 30 && !danger;
  const progress = duration > 0 ? Math.min(1, remaining / (duration * 1000)) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="eyebrow">{t("timer.label")}</span>
      <div
        className={clsx(
          "relative overflow-hidden rounded-xl border-2 bg-surface-2 px-4 py-0.5 font-mono text-[44px] tabular-nums leading-tight transition-colors",
          danger ? "border-ban text-ban" : warning ? "border-gold text-gold" : "border-line text-fg",
          status === "done" && "animate-pulse-danger",
        )}
        role="timer"
      >
        {formatClock(remaining)}
        <span
          className={clsx(
            "absolute bottom-0 left-0 h-[3px] transition-[width] duration-100 ease-linear",
            danger ? "bg-ban" : warning ? "bg-gold" : "bg-brand",
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={clsx(
            "btn btn-slant min-w-24",
            status === "running" ? "btn-danger-solid" : "btn-primary",
          )}
          onClick={toggle}
          title={`${status === "running" ? t("timer.pause") : t("timer.start")} (Space)`}
        >
          {status === "running" ? <Pause /> : <Play />}
          {status === "running"
            ? t("timer.pause")
            : status === "paused"
              ? t("timer.resume")
              : t("timer.start")}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={reset}
          title={`${t("timer.reset")} (R)`}
          aria-label={t("timer.reset")}
        >
          <RotateCcw />
        </button>
        <label className="flex items-center gap-1 text-muted text-xs" title={t("timer.duration")}>
          <input
            type="number"
            min={1}
            max={3599}
            className="input h-8 w-14 px-1.5 text-center font-mono"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setDuration(Number(draft))}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label={t("timer.duration")}
          />
          {t("timer.seconds")}
        </label>
      </div>
    </div>
  );
}

export function Scoreboard() {
  const t = useT();
  const swapSides = useDraft((s) => s.swapSides);
  return (
    <section className="panel flex flex-col items-center justify-center gap-2 px-4 py-3">
      <div className="flex items-center gap-2">
        <Score side="attacker" />
        <button
          type="button"
          className="btn btn-icon size-9 rounded-full"
          onClick={swapSides}
          title={t("swap")}
          aria-label={t("swap")}
        >
          <ArrowLeftRight />
        </button>
        <Score side="defender" />
      </div>
      <Timer />
    </section>
  );
}

import { create } from "zustand";
import { useSettings } from "./settings";

export type TimerStatus = "idle" | "running" | "paused" | "done";

interface TimerState {
  status: TimerStatus;
  /** Wall-clock deadline while running; immune to setInterval drift and throttling. */
  endsAt: number | null;
  /** Remaining time while idle/paused. */
  remainingMs: number;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  finish: () => void;
  setDuration: (seconds: number) => void;
}

const durationMs = () => useSettings.getState().timerDuration * 1000;

export const useTimer = create<TimerState>()((set, get) => ({
  status: "idle",
  endsAt: null,
  remainingMs: durationMs(),

  start: () => {
    const { status, remainingMs } = get();
    const ms = status === "paused" ? remainingMs : durationMs();
    set({ status: "running", endsAt: Date.now() + ms });
  },
  pause: () => {
    const { endsAt, status } = get();
    if (status !== "running" || endsAt == null) return;
    set({ status: "paused", endsAt: null, remainingMs: Math.max(0, endsAt - Date.now()) });
  },
  toggle: () => (get().status === "running" ? get().pause() : get().start()),
  reset: () => set({ status: "idle", endsAt: null, remainingMs: durationMs() }),
  finish: () => set({ status: "done", endsAt: null, remainingMs: 0 }),
  setDuration: (seconds) => {
    const clamped = Math.max(1, Math.min(3599, Math.round(seconds) || 60));
    useSettings.setState({ timerDuration: clamped });
    if (get().status === "idle" || get().status === "done")
      set({ status: "idle", remainingMs: clamped * 1000 });
  },
}));

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

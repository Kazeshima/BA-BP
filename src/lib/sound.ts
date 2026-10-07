let ctx: AudioContext | null = null;

/** Short synthesized beep; no audio assets needed. */
export function beep(frequency: number, durationMs: number, volume = 0.15) {
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {
    // Audio unavailable (e.g. autoplay policy before any interaction) — stay silent.
  }
}

export const tick = () => beep(880, 90);
export const alarm = () => {
  beep(660, 220, 0.2);
  setTimeout(() => beep(990, 420, 0.2), 230);
};

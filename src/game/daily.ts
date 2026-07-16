import { daily } from "@/data/puzzles";

export const LAUNCH_DATE = new Date(2026, 0, 1); // Jan 1, 2026 local

export function getTodayPuzzleNumber(now = new Date()): number {
  const start = new Date(
    LAUNCH_DATE.getFullYear(),
    LAUNCH_DATE.getMonth(),
    LAUNCH_DATE.getDate(),
  ).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.floor((today - start) / 86400000);
  return Math.max(1, days + 1);
}

export function getTodayPuzzle() {
  const n = getTodayPuzzleNumber();
  const idx = (n - 1) % daily.length;
  return { number: n, puzzle: daily[idx] };
}

export function msUntilTomorrow(now = new Date()): number {
  const t = new Date(now);
  t.setHours(24, 0, 0, 0);
  return t.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

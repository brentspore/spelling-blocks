import { daily } from "@/data/puzzles";

export const LAUNCH_DATE = "2026-01-01";
const PUZZLE_TIME_ZONE = "America/Los_Angeles";
const puzzleDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PUZZLE_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function dateOrdinal(date: Date): number {
  const parts = puzzleDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function getTodayPuzzleNumber(now = new Date()): number {
  const [year, month, day] = LAUNCH_DATE.split("-").map(Number);
  const launchOrdinal = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const days = dateOrdinal(now) - launchOrdinal;
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

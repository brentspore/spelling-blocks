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

/* ⚠ How a puzzle number picks its daily. Puzzles #1-#286 loop through the
 * original 91 dailies, (n - 1) % 91, and keep that mapping forever. #287
 * (2026-10-14) is the day the loop would first have repeated a puzzle served
 * since the site launched (#196 on 2026-07-15, POCKET+KNIVES). From there the
 * schedule walks the appended dailies in order, one per day, so appending more
 * never moves a day that has already been served.
 *
 * Never change these two numbers. A saved game (`daily_<n>` in localStorage)
 * restores by puzzle number with exact block positions, and share strings
 * carry the number too. The old formula was `(n - 1) % daily.length`, which
 * is why puzzles could not simply be appended: a longer list would have
 * reshuffled every day, today included.
 *
 * The `% extended` only matters if the appended list runs out, and
 * daily.test.ts fails the build 30 days before it does. */
export const ORIGINAL_DAILIES = 91;
export const FIRST_EXTENDED_PUZZLE = 287;

export function dailyIndex(n: number): number {
  if (n < FIRST_EXTENDED_PUZZLE) return (n - 1) % ORIGINAL_DAILIES;
  const extended = daily.length - ORIGINAL_DAILIES;
  return ORIGINAL_DAILIES + ((n - FIRST_EXTENDED_PUZZLE) % extended);
}

export function getTodayPuzzle() {
  const n = getTodayPuzzleNumber();
  return { number: n, puzzle: daily[dailyIndex(n)] };
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

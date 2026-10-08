/* When the daily reminder goes out, and which day it counts as.
 *
 * The network's dailies land at 8 AM Pacific. Vercel Cron is UTC only and does
 * not shift with DST, so the cron fires earlier (13:00 UTC, before 8 AM Pacific
 * in both seasons) and hands Resend a `scheduledAt` for the exact time.
 *
 * A TypeScript port of `scripts/lib/send-time.mjs` in the-trail-game,
 * word-kraven and tiny-across, which book the same time from GitHub Actions.
 * Keep the four in step.
 */

export const SEND_HOUR = 8;
export const SEND_TZ = "America/Los_Angeles";

/* A run before this hour (Pacific) books TODAY's send; at or after it, TOMORROW's.
 * A run after 8 AM but before this (a manual POST, say) still counts as today's
 * and goes out straight away. */
export const CUTOFF_HOUR = 16;

/* Closer than this to the send time, just send. Resend rejects a scheduledAt
 * in the past, and the request takes a moment to land. */
const MIN_LEAD_MS = 60_000;

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SEND_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

function wallClock(ms: number) {
  const p = Object.fromEntries(fmt.formatToParts(ms).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute };
}

/* The UTC instant of `hour`:00 Pacific on the given date. Two passes, because
 * the first guess can land on the wrong side of a DST change (the clocks move
 * at 2 AM, between the guess and 8 AM). */
function pacificTime(y: number, m: number, d: number, hour: number): number {
  const target = Date.UTC(y, m - 1, d, hour);
  let t = target;
  for (let i = 0; i < 2; i++) {
    const w = wallClock(t);
    t = target - (Date.UTC(w.y, w.m - 1, w.d, w.h, w.min) - t);
  }
  return t;
}

/** Which day this run is for, and when to send it.
 *  `at` is null when the send time has already passed: send now, late. */
export function planSend(now = new Date()): { date: string; at: Date | null } {
  const p = wallClock(now.getTime());
  // Date.UTC rolls a day-31-plus-one over into the next month and year.
  const day = new Date(Date.UTC(p.y, p.m - 1, p.d + (p.h >= CUTOFF_HOUR ? 1 : 0)));
  const at = pacificTime(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), SEND_HOUR);
  return {
    date: day.toISOString().slice(0, 10),
    at: at - now.getTime() >= MIN_LEAD_MS ? new Date(at) : null,
  };
}

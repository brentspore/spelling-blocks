import { describe, expect, it } from "vitest";
import { daily as dailies } from "@/data/puzzles";
import { dailyIndex, FIRST_EXTENDED_PUZZLE, getTodayPuzzleNumber, ORIGINAL_DAILIES } from "./daily";

describe("daily puzzle date", () => {
  it("uses the same Pacific calendar day on the server and in the browser", () => {
    expect(getTodayPuzzleNumber(new Date("2026-08-05T06:59:59Z"))).toBe(216);
    expect(getTodayPuzzleNumber(new Date("2026-08-05T07:00:00Z"))).toBe(217);
  });

  it("starts with puzzle one on launch day", () => {
    expect(getTodayPuzzleNumber(new Date("2026-01-01T20:00:00Z"))).toBe(1);
  });
});

describe("which daily a puzzle number gets", () => {
  it("keeps every day before the extension on its original puzzle", () => {
    // The formula that served #1-#281, when the list was exactly the original 91.
    for (let n = 1; n < FIRST_EXTENDED_PUZZLE; n++)
      expect(dailyIndex(n)).toBe((n - 1) % ORIGINAL_DAILIES);
  });

  it("starts the appended dailies on 2026-10-14 and walks them one a day", () => {
    expect(getTodayPuzzleNumber(new Date("2026-10-14T19:00:00Z"))).toBe(FIRST_EXTENDED_PUZZLE);
    expect(dailyIndex(FIRST_EXTENDED_PUZZLE)).toBe(ORIGINAL_DAILIES);
    expect(dailyIndex(FIRST_EXTENDED_PUZZLE + 100)).toBe(ORIGINAL_DAILIES + 100);
  });

  /* ⚠ Fails the build a month before the appended dailies run out, while there
   * is still time to add more. Past the end the schedule loops, and appending
   * after that would move days already played. Fix: node scripts/gen-dailies.mjs --add 365 */
  it("has at least 30 days of dailies left", () => {
    const lastScheduled = FIRST_EXTENDED_PUZZLE + (dailies.length - ORIGINAL_DAILIES) - 1;
    expect(lastScheduled - getTodayPuzzleNumber()).toBeGreaterThanOrEqual(30);
  });
});

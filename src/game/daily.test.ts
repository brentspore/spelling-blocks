import { describe, expect, it } from "vitest";
import { getTodayPuzzleNumber } from "./daily";

describe("daily puzzle date", () => {
  it("uses the same Pacific calendar day on the server and in the browser", () => {
    expect(getTodayPuzzleNumber(new Date("2026-08-05T06:59:59Z"))).toBe(216);
    expect(getTodayPuzzleNumber(new Date("2026-08-05T07:00:00Z"))).toBe(217);
  });

  it("starts with puzzle one on launch day", () => {
    expect(getTodayPuzzleNumber(new Date("2026-01-01T20:00:00Z"))).toBe(1);
  });
});
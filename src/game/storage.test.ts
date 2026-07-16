import { describe, it, expect } from "vitest";
import { nextStats, type Stats } from "./storage";

const base: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  cleanSolves: 0,
  lastWinPuzzle: null,
};

describe("nextStats", () => {
  it("records a first win", () => {
    const s = nextStats(base, 1, true);
    expect(s).toMatchObject({
      played: 1,
      wins: 1,
      cleanSolves: 1,
      currentStreak: 1,
      maxStreak: 1,
      lastWinPuzzle: 1,
    });
  });

  it("extends the streak on consecutive puzzle numbers", () => {
    const s1 = nextStats(base, 1, true);
    const s2 = nextStats(s1, 2, false);
    expect(s2.currentStreak).toBe(2);
    expect(s2.maxStreak).toBe(2);
    expect(s2.cleanSolves).toBe(1); // second win was not clean
  });

  it("resets the streak when a puzzle is skipped", () => {
    const s2 = nextStats(nextStats(base, 1, true), 2, true);
    const s5 = nextStats(s2, 5, true); // gap
    expect(s5.currentStreak).toBe(1);
    expect(s5.maxStreak).toBe(2); // best is remembered
    expect(s5.played).toBe(3);
  });

  it("is a no-op when the same puzzle is recorded twice", () => {
    const s1 = nextStats(base, 4, true);
    const again = nextStats(s1, 4, true);
    expect(again).toBe(s1); // unchanged reference — no inflation
    expect(again.played).toBe(1);
  });
});

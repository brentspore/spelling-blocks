import { describe, it, expect } from "vitest";
import { reconstructPlacedIndices, resolveRestoredState, findAvailableBlock } from "./dailyState";
import type { DailyState } from "./storage";

// CAT + DOG = 6 letters; pad to a stand-in 12-block puzzle isn't needed for
// these pure checks, so we use compact block arrays.

describe("reconstructPlacedIndices", () => {
  it("assigns one distinct block per letter, in order", () => {
    const blocks = ["C", "A", "T", "D", "O", "G"];
    expect(reconstructPlacedIndices(["CAT", "DOG"], blocks)).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
  });

  it("does not hand out blocks reserved by the builder (duplicate letters)", () => {
    const blocks = ["A", "A", "B", "C"];
    // Index 0 (first A) is sitting in the builder; the placed word "AB" must
    // use the *other* A (index 1), never the reserved one.
    const result = reconstructPlacedIndices(["AB"], blocks, [0]);
    expect(result).toEqual([[1, 2]]);
    expect(result[0]).not.toContain(0);
  });
});

describe("resolveRestoredState", () => {
  const blocks = ["C", "A", "T", "D", "O", "G"];

  it("restores exact saved placedIndices when present", () => {
    const saved: DailyState = {
      puzzleNumber: 1,
      placed: ["CAT"],
      placedIndices: [[2, 1, 0]], // deliberately not the greedy order
      builder: [3],
      startedAt: 1000,
      elapsedMs: 5000,
      won: false,
    };
    const r = resolveRestoredState(saved, blocks, 9999);
    expect(r.placedIndices).toEqual([[2, 1, 0]]);
    expect(r.builder).toEqual([3]);
  });

  it("reconstructs (reserving the builder) when placedIndices is missing", () => {
    const saved: DailyState = {
      puzzleNumber: 1,
      placed: ["CAT"],
      builder: [0], // first C is in the builder
      startedAt: null,
      elapsedMs: 0,
      won: false,
    };
    const blocksDup = ["C", "A", "T", "C"];
    const r = resolveRestoredState(saved, blocksDup, 100);
    // "CAT" must use the C at index 3, not the reserved builder block 0.
    expect(r.placedIndices[0][0]).toBe(3);
  });

  it("re-anchors a running clock to now so elapsed time is not double counted", () => {
    const saved: DailyState = {
      puzzleNumber: 1,
      placed: [],
      placedIndices: [],
      builder: [],
      startedAt: 1000, // original anchor, long ago
      elapsedMs: 42000, // 42s already banked
      won: false,
    };
    const r = resolveRestoredState(saved, blocks, 999999);
    expect(r.elapsedBase).toBe(42000);
    expect(r.startedAt).toBe(999999); // re-anchored, NOT 1000
  });

  it("leaves the clock stopped when the puzzle is already won", () => {
    const saved: DailyState = {
      puzzleNumber: 1,
      placed: ["CAT", "DOG"],
      placedIndices: [
        [0, 1, 2],
        [3, 4, 5],
      ],
      builder: [],
      startedAt: null,
      elapsedMs: 73000,
      won: true,
    };
    const r = resolveRestoredState(saved, blocks, 999999);
    expect(r.won).toBe(true);
    expect(r.startedAt).toBeNull();
    expect(r.elapsedBase).toBe(73000);
  });

  it("leaves the clock stopped when play has not started", () => {
    const saved: DailyState = {
      puzzleNumber: 1,
      placed: [],
      placedIndices: [],
      builder: [],
      startedAt: null,
      elapsedMs: 0,
      won: false,
    };
    expect(resolveRestoredState(saved, blocks, 5).startedAt).toBeNull();
  });
});

describe("findAvailableBlock", () => {
  const blocks = ["F", "L", "O", "O", "R"]; // two O's

  it("resolves duplicate letters to distinct blocks as the used set grows", () => {
    const used = new Set<number>();
    const first = findAvailableBlock(blocks, used, "o");
    expect(first).toBe(2);
    used.add(first);
    const second = findAvailableBlock(blocks, used, "O");
    expect(second).toBe(3);
    used.add(second);
    expect(findAvailableBlock(blocks, used, "O")).toBe(-1); // both consumed
  });

  it("returns -1 for a letter not in the tray", () => {
    expect(findAvailableBlock(blocks, new Set(), "Z")).toBe(-1);
  });
});

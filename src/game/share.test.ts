import { describe, it, expect } from "vitest";
import { buildShareText } from "./share";
import type { BlockColor } from "./colors";

// Build per-word block rows of the given lengths (colour is irrelevant to the
// text share — every tile renders as the same square).
function wordsOfLengths(lengths: number[]) {
  return lengths.map((n) =>
    Array.from({ length: n }, () => ({ letter: "X", color: "cobalt" as BlockColor })),
  );
}

describe("buildShareText", () => {
  it("emits one row per word, each matching the word length, in solve order", () => {
    const wordLetters = wordsOfLengths([5, 4, 3]); // QUICK / JUMP / FOX
    const text = buildShareText({
      puzzleNumber: 7,
      words: ["QUICK", "JUMP", "FOX"],
      timeStr: "1:23",
      blocks: [],
      wordLetters,
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("Spelling Blocks #7");
    expect(lines[1]).toBe("🟧🟧🟧🟧🟧"); // 5
    expect(lines[2]).toBe("🟧🟧🟧🟧"); // 4
    expect(lines[3]).toBe("🟧🟧🟧"); // 3
    expect(lines[4]).toBe("3 words in 1:23");
    expect(lines[5]).toBe("spellingblocks.com");
  });

  it("preserves solve order rather than sorting by length", () => {
    const text = buildShareText({
      puzzleNumber: 1,
      words: ["FOX", "QUICK"],
      timeStr: "0:30",
      blocks: [],
      wordLetters: wordsOfLengths([3, 5]),
    });
    const rows = text.split("\n").slice(1, 3);
    expect(rows).toEqual(["🟧🟧🟧", "🟧🟧🟧🟧🟧"]); // 3 then 5, as solved
  });
});

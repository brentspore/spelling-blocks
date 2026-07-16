import { describe, it, expect } from "vitest";
import { daily, practice, type Puzzle } from "./puzzles";
import { getDictionary } from "../game/dictionary";

// The exact dictionary the game validates placed words against.
const dict = getDictionary();

function toMultiset(letters: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of letters) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const ma = toMultiset(a);
  const mb = toMultiset(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) if (mb.get(k) !== v) return false;
  return true;
}

function validatePuzzle(p: Puzzle) {
  // Blocks are exactly 12 single uppercase letters.
  expect(p.blocks).toHaveLength(12);
  for (const b of p.blocks) expect(b).toMatch(/^[A-Z]$/);

  // The solution words exactly partition the blocks — same multiset of
  // letters, nothing left over and nothing extra.
  const solutionLetters = p.solution.join("").toUpperCase().split("");
  expect(
    sameMultiset(solutionLetters, p.blocks),
    `solution ${p.solution.join("+")} does not partition blocks ${p.blocks.join("")}`,
  ).toBe(true);

  // Par equals the number of solution words.
  expect(p.par).toBe(p.solution.length);

  // Every solution word is 3–9 letters and known to the game dictionary.
  for (const w of p.solution) {
    const W = w.toUpperCase();
    expect(W.length, `"${W}" must be 3–9 letters`).toBeGreaterThanOrEqual(3);
    expect(W.length, `"${W}" must be 3–9 letters`).toBeLessThanOrEqual(9);
    expect(dict.has(W), `"${W}" is not in the dictionary`).toBe(true);
  }
}

describe("daily puzzles", () => {
  daily.forEach((p, i) => {
    it(`daily #${i + 1} — ${p.solution.join(" ")}`, () => validatePuzzle(p));
  });
});

describe("practice puzzles", () => {
  practice.forEach((p, i) => {
    it(`practice #${i + 1} — ${p.solution.join(" ")}`, () => validatePuzzle(p));
  });
});

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

/* ⚠ Practice is unlimited, so anything it shares with the dailies is something a
 * keen player can learn ahead of time. A puzzle is really its set of 12 letters
 * (any valid split wins, and the tray shuffles), so letter sets are compared,
 * not word lists. */
/* The appended dailies are meant for players who have already been through the
 * original 91, so they must not feel like reruns of them, or of each other.
 * scripts/gen-dailies.mjs follows these rules; this keeps a hand edit honest. */
describe("appended dailies are fresh", () => {
  const original = daily.slice(0, 91);
  const extension = daily.slice(91);
  const gap = (a: Puzzle, b: Puzzle) => {
    const count = (s: string[]) => {
      const m: Record<string, number> = {};
      for (const c of s) m[c] = (m[c] || 0) + 1;
      return m;
    };
    const ma = count(a.blocks),
      mb = count(b.blocks);
    let shared = 0;
    for (const c in ma) shared += Math.min(ma[c], mb[c] || 0);
    return 12 - shared;
  };

  it("uses no word from the original dailies", () => {
    const seen = new Set(original.flatMap((p) => p.solution));
    expect(extension.flatMap((p) => p.solution).filter((w) => seen.has(w))).toEqual([]);
  });

  it("differs from every original daily by at least 4 letters", () => {
    const close = extension.flatMap((e) =>
      original
        .filter((o) => gap(e, o) < 4)
        .map((o) => `${e.solution.join("+")} ~ ${o.solution.join("+")}`),
    );
    expect(close).toEqual([]);
  });

  it("differs from every other appended daily by at least 3 letters, sharing at most one word", () => {
    const close: string[] = [];
    extension.forEach((a, i) =>
      extension.slice(i + 1).forEach((b) => {
        if (gap(a, b) < 3 || a.solution.filter((w) => b.solution.includes(w)).length > 1)
          close.push(`${a.solution.join("+")} ~ ${b.solution.join("+")}`);
      }),
    );
    expect(close).toEqual([]);
  });
});

describe("practice never previews a daily", () => {
  const letterGap = (a: string, b: string) => {
    const count = (s: string) => { const m: Record<string, number> = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; };
    const ma = count(a), mb = count(b);
    let shared = 0;
    for (const c in ma) shared += Math.min(ma[c], mb[c] || 0);
    return 12 - shared;
  };
  const dailyWords = new Set(daily.flatMap(p => p.solution.map(w => w.toUpperCase())));

  it("uses no word from any daily solution", () => {
    const reused = practice.flatMap(p => p.solution.map(w => w.toUpperCase())).filter(w => dailyWords.has(w));
    expect(reused).toEqual([]);
  });

  it("differs from every daily by at least 4 letters", () => {
    const close: string[] = [];
    for (const p of practice) for (const d of daily) {
      if (letterGap(p.blocks.join(""), d.blocks.join("")) < 4) close.push(`${p.solution.join("+")} ~ ${d.solution.join("+")}`);
    }
    expect(close).toEqual([]);
  });

  it("has enough of each difficulty to feel unlimited", () => {
    for (const par of [2, 3, 4]) expect(practice.filter(p => p.par === par).length).toBeGreaterThanOrEqual(30);
  });
});

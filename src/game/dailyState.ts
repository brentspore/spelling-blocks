import type { DailyState } from "./storage";

// Assign a concrete block index to every letter of every placed word. `reserved`
// holds indices that must not be handed out (e.g. blocks still in the builder),
// so duplicate letters never let a placed word steal a block that's in use.
export function reconstructPlacedIndices(
  words: string[],
  blocks: string[],
  reserved: Iterable<number> = [],
): number[][] {
  const used = new Set<number>(reserved);
  return words.map((word) => {
    const idxs: number[] = [];
    for (const ch of word.toUpperCase()) {
      const found = blocks.findIndex((b, i) => !used.has(i) && b === ch);
      if (found >= 0) {
        idxs.push(found);
        used.add(found);
      }
    }
    return idxs;
  });
}

export type RestoredState = {
  placed: string[];
  placedIndices: number[][];
  builder: number[];
  elapsedBase: number;
  startedAt: number | null;
  won: boolean;
};

// Turn a persisted DailyState back into live board state.
export function resolveRestoredState(
  saved: DailyState,
  blocks: string[],
  now: number,
): RestoredState {
  const placed = saved.placed ?? [];
  const builder = saved.builder ?? [];
  const savedIndices = saved.placedIndices;
  // Prefer the exact indices we saved (keeps colours/rotation identical); only
  // fall back to reconstruction for older saves that predate the field.
  const placedIndices =
    savedIndices && savedIndices.length === placed.length
      ? savedIndices
      : reconstructPlacedIndices(placed, blocks, builder);

  const running = !!saved.startedAt && !saved.won;
  return {
    placed,
    placedIndices,
    builder,
    elapsedBase: saved.elapsedMs ?? 0,
    // Re-anchor the clock to `now` on resume. Time already elapsed is banked in
    // elapsedMs; reusing the old startedAt would count it a second time via the
    // live (now - startedAt) delta and roughly double the displayed time.
    startedAt: running ? now : null,
    won: !!saved.won,
  };
}

// First tray block that carries `letter` and isn't already in use, or -1.
// Called once per keystroke, so duplicate letters resolve to distinct blocks as
// the used set grows.
export function findAvailableBlock(
  blocks: string[],
  used: ReadonlySet<number>,
  letter: string,
): number {
  const L = letter.toUpperCase();
  return blocks.findIndex((b, i) => b === L && !used.has(i));
}

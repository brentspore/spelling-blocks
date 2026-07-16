export const BLOCK_COLORS = ["cobalt", "grass", "butter", "cherry"] as const;
export type BlockColor = (typeof BLOCK_COLORS)[number];

export const COLOR_HEX: Record<BlockColor, string> = {
  cobalt: "#2B59C3",
  grass: "#3E8A4E",
  butter: "#F2B63C",
  cherry: "#C7402D",
};

// A composed spread of colours for one puzzle: every colour appears as evenly
// as possible, then a deterministic shuffle so no two puzzles look alike.
// Beats per-block random, which clumps one colour and starves another.
export function assignColors(n: number, seed: number): BlockColor[] {
  const colors: BlockColor[] = [];
  for (let i = 0; i < n; i++) colors.push(BLOCK_COLORS[i % BLOCK_COLORS.length]);
  let s = (seed * 2654435761 + 1) >>> 0;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  return colors;
}

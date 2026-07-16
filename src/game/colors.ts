export const BLOCK_COLORS = ["cobalt", "grass", "butter", "cherry"] as const;
export type BlockColor = (typeof BLOCK_COLORS)[number];

export const COLOR_HEX: Record<BlockColor, string> = {
  cobalt: "#2B59C3",
  grass: "#3E8A4E",
  butter: "#F2B63C",
  cherry: "#C7402D",
};

// Stable color per block index for a puzzle.
export function colorFor(index: number, seed: number): BlockColor {
  // Simple hash
  const v = (index * 2654435761 + seed * 1013904223) >>> 0;
  return BLOCK_COLORS[v % BLOCK_COLORS.length];
}

// Puzzle solutions. Blocks are derived by shuffling the concatenated letters
// using a deterministic seeded shuffle, guaranteeing an exact partition.

export type Puzzle = {
  blocks: string[]; // 12 letters
  par: number;
  solution: string[];
};

type SolutionSet = string[];

// The ORIGINAL 91 daily solutions. Each entry's letters must sum to 12.
// ⚠ Frozen: puzzles #1-#281 loop through these (dailyIndex in src/game/daily.ts),
// so editing, reordering or adding a row here changes days already played.
// New dailies go in daily-extension.ts, via scripts/gen-dailies.mjs.
const DAILY_SOLUTIONS: SolutionSet[] = [
  ["PLANET", "WHISKY"],
  ["JACKET", "PRISMS"],
  ["MARKET", "JUNGLE"],
  ["CANDLES", "BRUSH"],
  ["ORANGES", "PLUMS"],
  ["DINNERS", "PARTY"],
  ["WINTER", "SUMMER"],
  ["MONKEY", "BANANA"],
  ["ROCKETS", "MOONS"],
  ["CAMERA", "LIGHTS"],
  ["SPIDERS", "WEBBY"],
  ["TIGERS", "JUNGLE"],
  ["FLOWER", "GARDEN"],
  ["POCKET", "KNIVES"],
  ["BUTTER", "CANDLE"],
  ["SILVER", "BRONZE"],
  ["PURPLE", "CRAYON"],
  ["MASTER", "PLANET"],
  ["MODERN", "JUNGLE"],
  ["FRIEND", "PLANET"],
  ["SIMPLE", "JACKET"],
  ["PICNIC", "BASKET"],
  ["TRAVEL", "POCKET"],
  ["CASTLE", "DRAGON"],
  ["ROCKET", "LAUNCH"],
  ["HUNGRY", "DRAGON"],
  ["FOREST", "JUNGLE"],
  ["ORANGE", "MARBLE"],
  ["THUNDER", "STORM"],
  ["WINTER", "GARDEN"],
  ["MODERN", "POCKET"],
  ["CLEVER", "JOCKEY"],
  ["SILVER", "JACKET"],
  ["GLOBAL", "MARKET"],
  ["GOLDEN", "JACKET"],
  ["BRIGHT", "JUNGLE"],
  ["CANDLE", "MARBLE"],
  ["MODERN", "BASKET"],
  ["BRIGHT", "MARKET"],
  ["GARDEN", "MARBLE"],
  ["GARDEN", "CANDLE"],
  ["FROZEN", "MARBLE"],
  ["FROZEN", "JACKET"],
  ["FROZEN", "BASKET"],
  ["JUNGLE", "BASKET"],
  ["PLANET", "MARBLE"],
  ["QUICK", "JUMP", "FOX"],
  ["BRAVE", "WOLF", "DEN"],
  ["OCEAN", "WIND", "SKY"],
  ["MAGIC", "WOLF", "JOG"],
  ["TIGER", "WOLF", "JAM"],
  ["SPICY", "OVEN", "JAM"],
  ["FUNKY", "GOAT", "JAM"],
  ["SMOKY", "OVEN", "JAR"],
  ["PIANO", "JAZZ", "FEW"],
  ["QUEEN", "WAVE", "JOG"],
  ["BREAD", "MILK", "JOG"],
  ["MOUSE", "JUMP", "FIT"],
  ["BLACK", "JUMP", "FOX"],
  ["GRAPE", "JUMP", "FIT"],
  ["APPLE", "JUMP", "OWL"],
  ["STONE", "WIND", "SKY"],
  ["QUICK", "JUMP", "BOX"],
  ["GLOOM", "WAVE", "FIX"],
  ["BLAZE", "WOLF", "PIG"],
  ["HAPPY", "GOAT", "JIB"],
  ["SMOKY", "OVEN", "JAM"],
  ["FANCY", "OVEN", "JAM"],
  ["GRAND", "WOLF", "PIE"],
  ["PROUD", "WOLF", "JAM"],
  ["FRESH", "WOLF", "JAM"],
  ["CHIEF", "WOLF", "JAM"],
  ["GIANT", "WOLF", "JAM"],
  ["QUEEN", "WOLF", "JAM"],
  ["FLOOR", "WIND", "SKY"],
  ["CLOCK", "WIND", "SKY"],
  ["TRAIN", "WOLF", "JIB"],
  ["BEACH", "WOLF", "JAM"],
  ["CLOUD", "WIND", "SKY"],
  ["SWEET", "WOLF", "JAM"],
  ["CANDY", "WOLF", "JIB"],
  ["BOX", "JAM", "PUG", "WIT"],
  ["FOX", "JAM", "CUB", "WIG"],
  ["JOG", "MAT", "ICE", "PUB"],
  ["JAM", "POD", "WIG", "FEE"],
  ["OWL", "CUB", "JAM", "FIT"],
  ["APE", "OWL", "CUB", "JAM"],
  ["FIG", "JAR", "OWL", "PUB"],
  ["ELF", "JAB", "COW", "MUD"],
  ["JAM", "FIX", "PUB", "TOE"],
  ["JOG", "MAP", "WIN", "CUE"],
];

// Practice lives in its own GENERATED file (scripts/gen-practice.mjs) so it can
// never preview a daily; the rules are in that script and in puzzles.test.ts.
import { PRACTICE_SOLUTIONS } from "./practice-solutions";
import { DAILY_EXTENSION } from "./daily-extension";

// Mulberry32 seeded RNG for deterministic shuffles.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPuzzle(solution: string[], seed: number): Puzzle {
  const letters = solution.join("").toUpperCase().split("");
  if (letters.length !== 12) {
    throw new Error(
      `Puzzle must use exactly 12 letters, got ${letters.length}: ${solution.join(" ")}`,
    );
  }
  return {
    blocks: shuffled(letters, seed),
    par: solution.length,
    solution,
  };
}

// The extension continues the seed sequence, so the original 91 keep their exact
// block order.
export const daily: Puzzle[] = [...DAILY_SOLUTIONS, ...DAILY_EXTENSION].map((sol, i) =>
  buildPuzzle(sol, 1000 + i),
);
export const practice: Puzzle[] = PRACTICE_SOLUTIONS.map((sol, i) => buildPuzzle(sol, 5000 + i));

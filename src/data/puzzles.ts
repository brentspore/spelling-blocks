// Puzzle solutions. Blocks are derived by shuffling the concatenated letters
// using a deterministic seeded shuffle, guaranteeing an exact partition.

export type Puzzle = {
  blocks: string[]; // 12 letters
  par: number;
  solution: string[];
};

type SolutionSet = string[];

// 90 daily solutions. Each entry's letters must sum to 12.
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

// 40 practice solutions.
const PRACTICE_SOLUTIONS: SolutionSet[] = [
  ["PLANET", "MARKET"],
  ["JUNGLE", "PLANET"],
  ["ROCKET", "JUNGLE"],
  ["POCKET", "PLANET"],
  ["MARBLE", "POCKET"],
  ["CANDLE", "POCKET"],
  ["WINTER", "JACKET"],
  ["SUMMER", "BASKET"],
  ["GOLDEN", "MARBLE"],
  ["SILVER", "PLANET"],
  ["FROZEN", "PLANET"],
  ["BRIGHT", "PLANET"],
  ["MODERN", "JACKET"],
  ["CLEVER", "PLANET"],
  ["ORANGE", "PLANET"],
  ["CASTLE", "MARBLE"],
  ["DRAGON", "PLANET"],
  ["FOREST", "MARBLE"],
  ["GARDEN", "POCKET"],
  ["MASTER", "JUNGLE"],
  ["QUICK", "WOLF", "JAM"],
  ["BRAVE", "WOLF", "JIG"],
  ["SPICY", "GOAT", "JAM"],
  ["FUNKY", "WOLF", "JAM"],
  ["HAPPY", "OVEN", "JAM"],
  ["FANCY", "WOLF", "JIB"],
  ["MAGIC", "OVEN", "JAM"],
  ["SMOKY", "WOLF", "JAM"],
  ["PROUD", "GOAT", "JAM"],
  ["FRESH", "GOAT", "JAM"],
  ["GRAND", "OVEN", "JAM"],
  ["CHIEF", "OVEN", "JAM"],
  ["GIANT", "OVEN", "JAM"],
  ["BEACH", "OVEN", "JAM"],
  ["CLOUD", "OVEN", "JAM"],
  ["SWEET", "OVEN", "JAM"],
  ["JOG", "MAP", "TEN", "CUB"],
  ["FIX", "JAM", "PUB", "OWE"],
  ["JAB", "COW", "MUD", "PEG"],
  ["FIG", "JAR", "OWL", "CUB"],
  ["ELF", "JAB", "COW", "GUM"],
];

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

export const daily: Puzzle[] = DAILY_SOLUTIONS.map((sol, i) => buildPuzzle(sol, 1000 + i));
export const practice: Puzzle[] = PRACTICE_SOLUTIONS.map((sol, i) => buildPuzzle(sol, 5000 + i));

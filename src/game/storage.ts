const NS = "sb_";

export type Stats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  cleanSolves: number;
  lastWinPuzzle: number | null;
};

export type DailyState = {
  puzzleNumber: number;
  placed: string[]; // words placed in wall
  builder: number[]; // tray indices in builder
  startedAt: number | null;
  elapsedMs: number;
  won: boolean;
};

const DEFAULT_STATS: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  cleanSolves: 0,
  lastWinPuzzle: null,
};

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(NS + key);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export function getStats(): Stats {
  return { ...DEFAULT_STATS, ...read<Stats>("stats", DEFAULT_STATS) };
}
export function setStats(s: Stats) {
  write("stats", s);
}

export function getDailyState(puzzleNumber: number): DailyState | null {
  const s = read<DailyState | null>(`daily_${puzzleNumber}`, null);
  return s;
}
export function setDailyState(s: DailyState) {
  write(`daily_${s.puzzleNumber}`, s);
}

export function getBool(key: string, fallback: boolean): boolean {
  return read<boolean>(key, fallback);
}
export function setBool(key: string, v: boolean) {
  write(key, v);
}

export function getHelpSeen(): boolean {
  return read<boolean>("help_seen", false);
}
export function setHelpSeen(v: boolean) {
  write("help_seen", v);
}

export function recordWin(puzzleNumber: number, cleanSolve: boolean): Stats {
  const s = getStats();
  s.played += 1;
  s.wins += 1;
  if (cleanSolve) s.cleanSolves += 1;
  // Streak logic: consecutive daily puzzle numbers.
  if (s.lastWinPuzzle !== null && s.lastWinPuzzle === puzzleNumber - 1) {
    s.currentStreak += 1;
  } else if (s.lastWinPuzzle === puzzleNumber) {
    // already recorded, no change
  } else {
    s.currentStreak = 1;
  }
  if (s.currentStreak > s.maxStreak) s.maxStreak = s.currentStreak;
  s.lastWinPuzzle = puzzleNumber;
  setStats(s);
  return s;
}

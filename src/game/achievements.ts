import type { Stats } from "./storage";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // maps to a lucide icon in the UI
  earned: (s: Stats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first",
    name: "First wall",
    description: "Solve your first puzzle",
    icon: "award",
    earned: (s) => s.wins >= 1,
  },
  {
    id: "clean",
    name: "Clean solve",
    description: "Solve at or under par",
    icon: "sparkles",
    earned: (s) => s.cleanSolves >= 1,
  },
  {
    id: "clean10",
    name: "Tidy ten",
    description: "Ten clean solves",
    icon: "star",
    earned: (s) => s.cleanSolves >= 10,
  },
  {
    id: "streak3",
    name: "On a roll",
    description: "A three day streak",
    icon: "flame",
    earned: (s) => s.maxStreak >= 3,
  },
  {
    id: "streak7",
    name: "Week strong",
    description: "A seven day streak",
    icon: "calendar",
    earned: (s) => s.maxStreak >= 7,
  },
  {
    id: "streak14",
    name: "Two weeks",
    description: "A fourteen day streak",
    icon: "crown",
    earned: (s) => s.maxStreak >= 14,
  },
  {
    id: "wins10",
    name: "Regular",
    description: "Solve ten puzzles",
    icon: "trophy",
    earned: (s) => s.wins >= 10,
  },
  {
    id: "wins50",
    name: "Devoted",
    description: "Solve fifty puzzles",
    icon: "medal",
    earned: (s) => s.wins >= 50,
  },
  {
    id: "fast",
    name: "Speedy",
    description: "Solve in under a minute",
    icon: "zap",
    earned: (s) => s.bestTimeMs != null && s.bestTimeMs < 60000,
  },
  {
    id: "faster",
    name: "Lightning",
    description: "Solve in under thirty seconds",
    icon: "gem",
    earned: (s) => s.bestTimeMs != null && s.bestTimeMs < 30000,
  },
];

export function earnedIds(s: Stats): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.earned(s)).map((a) => a.id));
}

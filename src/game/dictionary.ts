import wordList from "an-array-of-english-words";

let cache: Set<string> | null = null;

export function getDictionary(): Set<string> {
  if (cache) return cache;
  const s = new Set<string>();
  for (const w of wordList as string[]) {
    if (w.length >= 3 && w.length <= 9) s.add(w.toUpperCase());
  }
  cache = s;
  return s;
}

export function isWord(w: string): boolean {
  return getDictionary().has(w.toUpperCase());
}

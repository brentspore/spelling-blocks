import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, BarChart2, Settings as SettingsIcon, Shuffle } from "lucide-react";
import type { Puzzle } from "@/data/puzzles";
import { daily, practice } from "@/data/puzzles";
import { getTodayPuzzle } from "@/game/daily";
import { isWord, getDictionary } from "@/game/dictionary";
import { colorFor, type BlockColor } from "@/game/colors";
import { clack, winChord, setMuted, isMuted } from "@/game/audio";
import {
  getDailyState,
  setDailyState,
  getHelpSeen,
  setHelpSeen,
  getBool,
  setBool,
  recordWin,
  type DailyState,
} from "@/game/storage";
import { resolveRestoredState, findAvailableBlock } from "@/game/dailyState";
import { Block } from "./Block";
import { Modal } from "./Modal";
import { HelpBody } from "./HelpModal";
import { StatsBody } from "./StatsModal";
import { SettingsBody } from "./SettingsModal";
import { ResultsBody } from "./ResultsModal";

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

type Mode = { kind: "daily"; number: number } | { kind: "practice"; index: number };

export function Game() {
  // Preload dictionary
  useEffect(() => {
    getDictionary();
  }, []);

  const today = useMemo(() => getTodayPuzzle(), []);
  const [mode, setMode] = useState<Mode>({ kind: "daily", number: today.number });
  const [practiceIndex, setPracticeIndex] = useState<number>(() =>
    Math.floor(Math.random() * practice.length),
  );

  const puzzle: Puzzle =
    mode.kind === "daily" ? daily[(mode.number - 1) % daily.length] : practice[practiceIndex];

  // Colors per block index, stable per puzzle
  const seed = mode.kind === "daily" ? mode.number : 10000 + practiceIndex;
  const blockColors: BlockColor[] = useMemo(
    () => puzzle.blocks.map((_, i) => colorFor(i, seed)),
    [puzzle, seed],
  );
  const rotations = useMemo(
    () => puzzle.blocks.map((_, i) => ((i * 37 + seed) % 5) - 2),
    [puzzle, seed],
  );

  // Persistent daily state
  const [placed, setPlaced] = useState<string[]>([]);
  const [placedIndices, setPlacedIndices] = useState<number[][]>([]); // per word: which block indices
  const [builder, setBuilder] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedBase, setElapsedBase] = useState(0);
  const [now, setNow] = useState<number>(() => Date.now());
  const [shakeKey, setShakeKey] = useState(0);
  const [invalidWord, setInvalidWord] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [wonAt, setWonAt] = useState<number | null>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // First-visit help
  useEffect(() => {
    if (!getHelpSeen()) {
      setShowHelp(true);
      setHelpSeen(true);
    }
    setMuted(!getBool("sound", false));
  }, []);

  // Load persistent daily state on daily mode
  useEffect(() => {
    if (mode.kind !== "daily") {
      setPlaced([]);
      setPlacedIndices([]);
      setBuilder([]);
      setStartedAt(null);
      setElapsedBase(0);
      setWon(false);
      setWonAt(null);
      return;
    }
    const s = getDailyState(mode.number);
    if (s) {
      const r = resolveRestoredState(s, puzzle.blocks, Date.now());
      setPlaced(r.placed);
      setPlacedIndices(r.placedIndices);
      setBuilder(r.builder);
      setStartedAt(r.startedAt);
      setElapsedBase(r.elapsedBase);
      setWon(r.won);
    } else {
      setPlaced([]);
      setPlacedIndices([]);
      setBuilder([]);
      setStartedAt(null);
      setElapsedBase(0);
      setWon(false);
      setWonAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, mode.kind === "daily" ? mode.number : -1]);

  // Persist daily state
  useEffect(() => {
    if (mode.kind !== "daily") return;
    const state: DailyState = {
      puzzleNumber: mode.number,
      placed,
      placedIndices,
      builder,
      startedAt,
      elapsedMs: startedAt && !won ? elapsedBase + (Date.now() - startedAt) : elapsedBase,
      won,
    };
    setDailyState(state);
  }, [mode, placed, placedIndices, builder, startedAt, elapsedBase, won]);

  // Timer tick
  useEffect(() => {
    if (!startedAt || won) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt, won]);

  const elapsedMs = startedAt && !won ? elapsedBase + (now - startedAt) : elapsedBase;

  const usedIndices = useMemo(() => {
    const s = new Set<number>();
    for (const arr of placedIndices) for (const i of arr) s.add(i);
    for (const i of builder) s.add(i);
    return s;
  }, [placedIndices, builder]);

  const startTimerIfNeeded = useCallback(() => {
    if (!startedAt && !won) setStartedAt(Date.now());
  }, [startedAt, won]);

  const addToBuilder = useCallback(
    (i: number) => {
      if (usedIndices.has(i) || won) return;
      startTimerIfNeeded();
      setBuilder((b) => [...b, i]);
      clack(1);
    },
    [usedIndices, won, startTimerIfNeeded],
  );

  const addByLetter = useCallback(
    (letter: string) => {
      if (won) return;
      const idx = findAvailableBlock(puzzle.blocks, usedIndices, letter);
      if (idx >= 0) addToBuilder(idx);
    },
    [puzzle, usedIndices, won, addToBuilder],
  );

  const removeFromBuilder = useCallback((posInBuilder: number) => {
    setBuilder((b) => b.filter((_, i) => i !== posInBuilder));
    clack(1.2);
  }, []);

  const currentWord = builder.map((i) => puzzle.blocks[i]).join("");
  const canPlace = currentWord.length >= 3 && isWord(currentWord);

  const placeWord = useCallback(() => {
    if (!canPlace) {
      setShakeKey((k) => k + 1);
      setInvalidWord("Not a word we know");
      window.setTimeout(() => setInvalidWord(null), 1200);
      return;
    }
    const wordIdx = [...builder];
    const word = currentWord;
    setPlaced((p) => [...p, word]);
    setPlacedIndices((p) => [...p, wordIdx]);
    setBuilder([]);
    clack(0.8);
    // Check win
    const totalUsed = usedIndices.size; // includes builder we just cleared? recompute
    const newUsed = new Set<number>();
    for (const arr of [...placedIndices, wordIdx]) for (const i of arr) newUsed.add(i);
    if (newUsed.size === puzzle.blocks.length) {
      // WIN
      const finalElapsed = startedAt ? elapsedBase + (Date.now() - startedAt) : elapsedBase;
      setElapsedBase(finalElapsed);
      setStartedAt(null);
      setWon(true);
      setWonAt(Date.now());
      if (mode.kind === "daily") {
        const clean = placed.length + 1 <= puzzle.par;
        recordWin(mode.number, clean);
      }
      winChord();
      window.setTimeout(() => setShowResults(true), 700);
    } else if (totalUsed + wordIdx.length > puzzle.blocks.length) {
      // impossible but safe
    }
  }, [
    canPlace,
    builder,
    currentWord,
    placedIndices,
    puzzle.blocks.length,
    puzzle.par,
    startedAt,
    elapsedBase,
    mode,
    placed.length,
    usedIndices.size,
  ]);

  const breakWord = useCallback((wordPos: number) => {
    setPlaced((p) => p.filter((_, i) => i !== wordPos));
    setPlacedIndices((p) => p.filter((_, i) => i !== wordPos));
    clack(1.1);
  }, []);

  const shuffleTray = useCallback(() => {
    // Present via re-mapping display order; simplest: shuffle a display order state.
    setDisplayOrder((d) => {
      const a = d.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
    clack(1);
  }, []);

  const [displayOrder, setDisplayOrder] = useState<number[]>(() => puzzle.blocks.map((_, i) => i));
  useEffect(() => {
    setDisplayOrder(puzzle.blocks.map((_, i) => i));
  }, [puzzle]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHelp || showStats || showSettings || showResults) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        placeWord();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setBuilder((b) => b.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addByLetter(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addByLetter, placeWord, showHelp, showStats, showSettings, showResults]);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2000);
  };

  // Practice mode next
  const startPractice = () => {
    setPracticeIndex(Math.floor(Math.random() * practice.length));
    setMode({ kind: "practice", number: -1 } as unknown as Mode);
    // Reset because practice mode share the same "practice" kind
    setPlaced([]);
    setPlacedIndices([]);
    setBuilder([]);
    setStartedAt(null);
    setElapsedBase(0);
    setWon(false);
    setWonAt(null);
    setShowResults(false);
  };
  const backToDaily = () => {
    setMode({ kind: "daily", number: today.number });
  };
  const nextPractice = () => {
    setPracticeIndex((i) => (i + 1) % practice.length);
    setPlaced([]);
    setPlacedIndices([]);
    setBuilder([]);
    setStartedAt(null);
    setElapsedBase(0);
    setWon(false);
    setWonAt(null);
    setShowResults(false);
  };

  // Sizes
  const trayBlockSize = 56;
  // Wall block size adaptive to widest word
  const maxWordLen = Math.max(...placed.map((w) => w.length), 1);
  const wallBlockSize = Math.min(56, Math.floor(340 / maxWordLen));

  const isPractice = mode.kind === "practice";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px 40px", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Spelling Blocks
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="sb-btn sb-btn--icon"
            onClick={() => setShowHelp(true)}
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="sb-btn sb-btn--icon"
            onClick={() => setShowStats(true)}
            aria-label="Stats"
          >
            <BarChart2 size={20} />
          </button>
          <button
            className="sb-btn sb-btn--icon"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          fontSize: 13,
          color: "#26221B",
          opacity: 0.8,
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {isPractice ? "Practice" : `#${mode.kind === "daily" ? mode.number : ""}`} · par{" "}
          {puzzle.par}
        </span>
        <span>{formatTime(elapsedMs)}</span>
        <button
          onClick={isPractice ? backToDaily : startPractice}
          style={{
            background: "transparent",
            border: "1px solid #26221B",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: "#26221B",
            cursor: "pointer",
          }}
        >
          {isPractice ? "Back to daily" : "Practice"}
        </button>
      </div>

      {/* Tray */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          padding: 12,
          minHeight: trayBlockSize * 2 + 20,
          background: "rgba(38,34,27,0.04)",
          borderRadius: 12,
          border: "1px dashed rgba(38,34,27,0.3)",
        }}
      >
        {displayOrder.map((i) => (
          <Block
            key={i}
            letter={puzzle.blocks[i]}
            color={blockColors[i]}
            size={trayBlockSize}
            rotate={rotations[i]}
            used={usedIndices.has(i)}
            onClick={() => addToBuilder(i)}
          />
        ))}
      </div>

      {/* Builder */}
      <div style={{ marginTop: 16 }}>
        <div
          key={shakeKey}
          className={invalidWord ? "sb-shake" : ""}
          style={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            minHeight: 60,
            padding: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {builder.length === 0 ? (
            <span style={{ opacity: 0.4, fontSize: 14 }}>tap blocks to build a word</span>
          ) : (
            builder.map((bi, pos) => (
              <Block
                key={`${bi}-${pos}`}
                letter={puzzle.blocks[bi]}
                color={blockColors[bi]}
                size={44}
                variant="builder"
                onClick={() => removeFromBuilder(pos)}
              />
            ))
          )}
        </div>
        {invalidWord && (
          <div style={{ textAlign: "center", fontSize: 13, color: "#C7402D", fontWeight: 600 }}>
            {invalidWord}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
          <button
            className="sb-btn sb-btn--ghost"
            onClick={shuffleTray}
            aria-label="Shuffle"
            style={{ minWidth: 48 }}
          >
            <Shuffle size={18} />
          </button>
          <button className="sb-btn" onClick={placeWord} disabled={builder.length < 3}>
            Place word
          </button>
        </div>
      </div>

      {/* Word wall */}
      <div
        style={{
          marginTop: 20,
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 4,
          padding: 10,
          background: "rgba(38,34,27,0.04)",
          borderRadius: 12,
        }}
      >
        {placed.length === 0 ? (
          <span style={{ opacity: 0.4, fontSize: 13 }}>your wall builds here</span>
        ) : (
          placed.map((word, wi) => (
            <button
              key={wi}
              onClick={() => breakWord(wi)}
              className="sb-settle"
              style={{
                display: "flex",
                gap: 0,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: won ? "default" : "pointer",
              }}
              disabled={won}
              aria-label={`Break ${word}`}
            >
              {placedIndices[wi]?.map((bi, li) => (
                <Block
                  key={li}
                  letter={puzzle.blocks[bi]}
                  color={blockColors[bi]}
                  size={wallBlockSize}
                  variant="placed"
                />
              ))}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: "1px solid rgba(38,34,27,0.15)",
          textAlign: "center",
          fontSize: 12,
          color: "#26221b",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="https://synergyprod.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#26221b",
              textDecoration: "none",
              opacity: 0.8,
            }}
          >
            <span style={{ opacity: 0.7 }}>Made by</span>
            <img src="/synergy-logo.svg" alt="Synergy" height={18} style={{ display: "block" }} />
          </a>
          <a
            href="https://synergyprod.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#26221b", opacity: 0.7 }}
          >
            Privacy
          </a>
        </div>
        <div style={{ opacity: 0.5, marginTop: 10, fontSize: 11 }}>
          © 2026 Synergy. We use cookies for analytics.
        </div>
      </footer>

      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="How to play">
        <HelpBody />
      </Modal>
      <Modal open={showStats} onClose={() => setShowStats(false)} title="Stats">
        <StatsBody />
      </Modal>
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <SettingsBody
          initialSound={!isMuted()}
          onChangeSound={(v) => {
            setMuted(!v);
            setBool("sound", v);
          }}
        />
      </Modal>
      <Modal open={showResults} onClose={() => setShowResults(false)}>
        <ResultsBody
          puzzleNumber={mode.kind === "daily" ? mode.number : today.number}
          words={placed}
          wordBlocks={placedIndices.map((arr) =>
            arr.map((bi) => ({ letter: puzzle.blocks[bi], color: blockColors[bi] })),
          )}
          allBlocks={puzzle.blocks.map((l, i) => ({ letter: l, color: blockColors[i] }))}
          timeStr={formatTime(elapsedMs)}
          par={puzzle.par}
          isPractice={isPractice}
          onNextPractice={nextPractice}
          onToast={showToast}
          justWonAt={wonAt}
        />
      </Modal>

      {toast && <div className="sb-toast">{toast}</div>}
    </div>
  );
}

import type { BlockColor } from "@/game/colors";
import { Block } from "./Block";
import { buildShareText, renderShareCard } from "@/game/share";

type Props = {
  puzzleNumber: number;
  words: string[];
  wordBlocks: { letter: string; color: BlockColor }[][];
  allBlocks: { letter: string; color: BlockColor }[];
  timeStr: string;
  par: number;
  isPractice: boolean;
  onNextPractice: () => void;
  onToast: (m: string) => void;
  justWonAt: number | null;
};

export function ResultsBody({
  puzzleNumber,
  words,
  wordBlocks,
  timeStr,
  par,
  isPractice,
  onNextPractice,
  onToast,
}: Props) {
  const clean = words.length <= par;

  const share = async () => {
    const text = buildShareText({
      puzzleNumber,
      words,
      timeStr,
      blocks: [],
      wordLetters: wordBlocks,
    });
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      onToast("Copied");
    } catch {
      onToast("Copy failed");
    }
  };

  const saveImage = async () => {
    const blob = await renderShareCard({
      puzzleNumber,
      words,
      timeStr,
      blocks: [],
      wordLetters: wordBlocks,
    });
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare) {
      const file = new File([blob], `spelling-blocks-${puzzleNumber}.png`, {
        type: "image/png",
      });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch {
          // fall through
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spelling-blocks-${puzzleNumber}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onToast("Saved");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          margin: "0 0 8px",
        }}
      >
        You built the wall!
      </h2>
      <div style={{ opacity: 0.75, marginBottom: 16, fontSize: 14 }}>
        {isPractice ? "Practice" : `Puzzle #${puzzleNumber}`} · {words.length} words · {timeStr}
      </div>

      {clean && !isPractice && (
        <div
          style={{
            display: "inline-block",
            background: "#3E8A4E",
            color: "#F1E7D0",
            padding: "4px 12px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Clean solve
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          margin: "12px 0 20px",
        }}
      >
        {wordBlocks.map((word, i) => (
          <div key={i} style={{ display: "flex", gap: 0 }}>
            {word.map((b, j) => (
              <Block key={j} letter={b.letter} color={b.color} size={32} variant="placed" />
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="sb-btn" onClick={share}>
          Share result
        </button>
        <button className="sb-btn sb-btn--ghost" onClick={saveImage}>
          Save image
        </button>
        {isPractice && (
          <button className="sb-btn sb-btn--ghost" onClick={onNextPractice}>
            Next practice
          </button>
        )}
      </div>
    </div>
  );
}

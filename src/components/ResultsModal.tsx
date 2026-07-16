import { useState, type FormEvent } from "react";
import type { BlockColor } from "@/game/colors";
import { Block } from "./Block";
import { buildShareText, renderShareCard } from "@/game/share";
import {
  getStats,
  getEmailSignedUp,
  setEmailSignedUp,
  getEmailDismissed,
  setEmailDismissed,
} from "@/game/storage";

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

  // Email signup shows from the player's second win, until they sign up or
  // dismiss it twice.
  const [emailPhase, setEmailPhase] = useState<"form" | "done" | "hidden">(() => {
    if (getEmailSignedUp() || getEmailDismissed() >= 2) return "hidden";
    return getStats().wins >= 2 ? "form" : "hidden";
  });
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setEmailSignedUp(true);
        setEmailPhase("done");
      } else {
        setEmailError(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setEmailError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const dismissEmail = () => {
    setEmailDismissed(getEmailDismissed() + 1);
    setEmailPhase("hidden");
  };

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

      {emailPhase !== "hidden" && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid rgba(38,34,27,0.2)",
          }}
        >
          {emailPhase === "done" ? (
            <div style={{ fontWeight: 600, fontSize: 15 }}>You're in. See you tomorrow.</div>
          ) : (
            <form onSubmit={submitEmail}>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                Get the daily puzzle in your inbox
              </div>
              {/* Honeypot: hidden from people, tempting to bots. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  style={{
                    flex: "1 1 200px",
                    minWidth: 0,
                    padding: "12px 14px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    color: "#26221B",
                    background: "#fff",
                    border: "2px solid #26221B",
                    borderRadius: 10,
                  }}
                />
                <button className="sb-btn" type="submit" disabled={submitting}>
                  {submitting ? "Signing up" : "Sign me up"}
                </button>
              </div>
              {emailError && (
                <div style={{ color: "#C7402D", fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                  {emailError}
                </div>
              )}
              <button
                type="button"
                onClick={dismissEmail}
                style={{
                  marginTop: 12,
                  background: "transparent",
                  border: "none",
                  color: "#26221B",
                  opacity: 0.6,
                  fontSize: 13,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                No thanks
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

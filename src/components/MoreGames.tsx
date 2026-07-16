import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

// Sibling games in the network. Each shows a letter-block badge, matching the
// Spelling Blocks look, rather than a remote favicon. The results dialog shows
// a random three of these.
const GAMES: { name: string; tagline: string; url: string; initial: string }[] = [
  {
    name: "The Trail Game",
    tagline: "Daily one-line path puzzle",
    url: "https://onepagetoys.com/toys/trail-game/",
    initial: "T",
  },
  {
    name: "Five Second Game",
    tagline: "Stop the timer at five",
    url: "https://5secondgame.com",
    initial: "5",
  },
  {
    name: "Eyeball It",
    tagline: "Daily estimation game",
    url: "https://eyeball-it.com",
    initial: "E",
  },
  {
    name: "Mini Golf",
    tagline: "Nine holes on one page",
    url: "https://onepagetoys.com/toys/mini-golf/",
    initial: "G",
  },
  {
    name: "Pool",
    tagline: "Rack them up",
    url: "https://onepagetoys.com/toys/pool/",
    initial: "P",
  },
  {
    name: "Minesweeper",
    tagline: "Clear the mines",
    url: "https://onepagetoys.com/toys/minesweeper/",
    initial: "M",
  },
  {
    name: "Perfect Circle",
    tagline: "Draw it round",
    url: "https://onepagetoys.com/toys/perfect-circle/",
    initial: "C",
  },
  {
    name: "One Page Toys",
    tagline: "More toys and games",
    url: "https://onepagetoys.com",
    initial: "O",
  },
];

const COLORS = ["#2b59c3", "#3e8a4e", "#c7402d", "#f2b63c"];

export function MoreGames() {
  const picks = useMemo(() => {
    const a = [...GAMES];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, 3);
  }, []);

  return (
    <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(38,34,27,0.15)" }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, textAlign: "left" }}>
        More games
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {picks.map((g, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <a
              key={g.url}
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 11px",
                borderRadius: 10,
                border: "1px solid rgba(38,34,27,0.14)",
                textDecoration: "none",
                color: "#26221b",
              }}
            >
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  border: "2px solid #26221b",
                  boxShadow: "0 2px 0 #26221b",
                  background: color,
                  color: color === "#f2b63c" ? "#26221b" : "#f1e7d0",
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 17,
                }}
              >
                {g.initial}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{g.name}</span>
                <span style={{ display: "block", fontSize: 12, opacity: 0.7 }}>{g.tagline}</span>
              </span>
              <ExternalLink size={15} style={{ opacity: 0.5, flex: "none" }} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

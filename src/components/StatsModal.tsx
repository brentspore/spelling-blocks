import { useEffect, useState } from "react";
import { getStats } from "@/game/storage";
import { msUntilTomorrow, formatCountdown } from "@/game/daily";

export function StatsBody() {
  const s = getStats();
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilTomorrow()));
  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdown(msUntilTomorrow())), 1000);
    return () => window.clearInterval(id);
  }, []);
  const winPct = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Stat n={s.played} label="played" />
        <Stat n={winPct} label="win %" />
        <Stat n={s.currentStreak} label="streak" />
        <Stat n={s.maxStreak} label="max streak" />
        <Stat n={s.cleanSolves} label="clean solves" />
        <Stat n={s.wins} label="wins" />
      </div>
      <div style={{ textAlign: "center", opacity: 0.7, fontSize: 14 }}>
        Next puzzle in
        <div
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          {countdown}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: 32,
          lineHeight: 1,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{label}</div>
    </div>
  );
}

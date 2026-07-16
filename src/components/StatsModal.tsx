import { useEffect, useState, type ComponentType } from "react";
import {
  Award,
  Sparkles,
  Star,
  Flame,
  CalendarCheck,
  Crown,
  Trophy,
  Medal,
  Zap,
  Gem,
  Lock,
} from "lucide-react";
import { getStats } from "@/game/storage";
import { msUntilTomorrow, formatCountdown } from "@/game/daily";
import { ACHIEVEMENTS, earnedIds } from "@/game/achievements";

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  award: Award,
  sparkles: Sparkles,
  star: Star,
  flame: Flame,
  calendar: CalendarCheck,
  crown: Crown,
  trophy: Trophy,
  medal: Medal,
  zap: Zap,
  gem: Gem,
};
const BADGE_COLORS = ["#2b59c3", "#3e8a4e", "#c7402d", "#f2b63c"];

export function StatsBody() {
  const s = getStats();
  const earned = earnedIds(s);
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
          marginBottom: 22,
        }}
      >
        <Stat n={s.played} label="played" />
        <Stat n={winPct} label="win %" />
        <Stat n={s.currentStreak} label="streak" />
        <Stat n={s.maxStreak} label="max streak" />
        <Stat n={s.cleanSolves} label="clean solves" />
        <Stat n={s.wins} label="wins" />
      </div>

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>Achievements</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            {earned.size}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {ACHIEVEMENTS.map((a, i) => {
            const isEarned = earned.has(a.id);
            const Icon = isEarned ? (ICONS[a.icon] ?? Award) : Lock;
            const color = BADGE_COLORS[i % BADGE_COLORS.length];
            return (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(38,34,27,0.12)",
                  background: isEarned ? "rgba(38,34,27,0.03)" : "transparent",
                  opacity: isEarned ? 1 : 0.55,
                }}
              >
                <span
                  style={{
                    flex: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "2px solid #26221b",
                    background: isEarned ? color : "rgba(38,34,27,0.12)",
                    color: isEarned && a.icon !== "star" ? "#f1e7d0" : "#26221b",
                  }}
                >
                  <Icon size={16} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 12.5 }}>
                    {a.name}
                  </span>
                  <span style={{ display: "block", fontSize: 11, opacity: 0.7, lineHeight: 1.2 }}>
                    {a.description}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
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

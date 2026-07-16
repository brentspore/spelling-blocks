import { COLOR_HEX, type BlockColor } from "@/game/colors";

type Props = {
  letter: string;
  color: BlockColor;
  size?: number;
  rotate?: number;
  onClick?: () => void;
  disabled?: boolean;
  used?: boolean;
  variant?: "tray" | "builder" | "placed";
  cornerIndex?: number;
};

export function Block({
  letter,
  color,
  size = 56,
  rotate = 0,
  onClick,
  disabled,
  used,
  variant = "tray",
  cornerIndex,
}: Props) {
  const bg = COLOR_HEX[color];
  const cls = [
    "sb-block",
    variant === "tray" && "sb-block--tray",
    variant === "placed" && "sb-block--placed",
    used && "sb-block--used",
  ]
    .filter(Boolean)
    .join(" ");
  const fontSize = Math.round(size * 0.5);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || used}
      className={cls}
      style={{
        width: size,
        height: size,
        background: bg,
        transform: `rotate(${rotate}deg)`,
        fontSize,
        lineHeight: 1,
      }}
      aria-label={`Letter ${letter}`}
    >
      {letter}
      {cornerIndex && cornerIndex > 1 ? (
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 5,
            fontFamily: "'Schibsted Grotesk', sans-serif",
            fontSize: Math.max(9, Math.round(size * 0.18)),
            fontWeight: 700,
            opacity: 0.8,
          }}
        >
          {cornerIndex}
        </span>
      ) : null}
    </button>
  );
}

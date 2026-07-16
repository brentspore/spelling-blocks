import type { CSSProperties } from "react";
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
  flow?: number;
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
  flow,
}: Props) {
  const bg = COLOR_HEX[color];
  const cls = [
    "sb-block",
    variant === "tray" && "sb-block--tray",
    variant === "builder" && "sb-block--builder",
    variant === "placed" && "sb-block--placed",
    used && "sb-block--used",
  ]
    .filter(Boolean)
    .join(" ");
  const fontSize = Math.round(size * 0.5);
  const style = {
    width: size,
    height: size,
    "--c": bg,
    "--rot": `${rotate}deg`,
    ...(flow !== undefined ? { "--wi": flow } : {}),
    // Light letters on the dark blocks, ink on the light butter block.
    color: color === "butter" ? "#26221b" : "#f1e7d0",
    fontSize,
    lineHeight: 1,
  } as CSSProperties;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || used}
      className={cls}
      style={style}
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

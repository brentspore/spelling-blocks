import { COLOR_HEX, type BlockColor } from "@/game/colors";

type BlockData = { letter: string; color: BlockColor };

export type ShareData = {
  puzzleNumber: number;
  words: string[];
  timeStr: string;
  blocks: BlockData[]; // for wall render
  wordLetters: BlockData[][]; // per-word blocks
};

export function buildShareText(d: ShareData): string {
  const rows = d.wordLetters
    .map((w) => "🟧".repeat(w.length))
    .join("\n");
  return `Spelling Blocks #${d.puzzleNumber}\n${rows}\n${d.words.length} words in ${d.timeStr}\nspellingblocks.com`;
}

export async function renderShareCard(d: ShareData): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#F1E7D0";
  ctx.fillRect(0, 0, size, size);

  // Title
  ctx.fillStyle = "#26221B";
  ctx.font = "700 60px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Spelling Blocks", size / 2, 110);
  ctx.font = "500 34px 'Schibsted Grotesk', sans-serif";
  ctx.fillText(`#${d.puzzleNumber}`, size / 2, 160);

  // Wall
  const wallTop = 220;
  const wallHeight = 640;
  const wallWidth = 900;
  const wallX = (size - wallWidth) / 2;
  const maxLen = Math.max(...d.wordLetters.map((w) => w.length), 1);
  const bs = Math.min(120, Math.floor(wallWidth / maxLen) - 8);
  const totalH = d.wordLetters.length * (bs + 10);
  let y = wallTop + Math.max(0, (wallHeight - totalH) / 2);
  for (const word of d.wordLetters) {
    const rowW = word.length * bs;
    let x = (size - rowW) / 2;
    for (const b of word) {
      // shadow
      ctx.fillStyle = "#26221B";
      ctx.fillRect(x + 5, y + 6, bs - 4, bs - 4);
      // face
      ctx.fillStyle = COLOR_HEX[b.color];
      ctx.strokeStyle = "#26221B";
      ctx.lineWidth = 4;
      roundRect(ctx, x, y, bs - 4, bs - 4, 12);
      ctx.fill();
      ctx.stroke();
      // letter
      ctx.fillStyle = "#26221B";
      ctx.font = `${Math.floor(bs * 0.5)}px 'Archivo Black', sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(b.letter, x + (bs - 4) / 2, y + (bs - 4) / 2 + 4);
      x += bs;
    }
    y += bs + 10;
  }
  ctx.textBaseline = "alphabetic";

  // Footer
  ctx.fillStyle = "#26221B";
  ctx.font = "600 34px 'Schibsted Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${d.words.length} words in ${d.timeStr}`, size / 2, 960);
  ctx.font = "500 28px 'Schibsted Grotesk', sans-serif";
  ctx.fillText("spellingblocks.com", size / 2, 1010);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

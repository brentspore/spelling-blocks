// Wrap a 256x256 PNG in a single-image ICO container. Usage:
//   node scripts/png-to-ico.mjs <in.png> <out.ico>
import { readFileSync, writeFileSync } from "node:fs";

const png = readFileSync(process.argv[2]);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(0, 6); // width  (0 = 256)
header.writeUInt8(0, 7); // height (0 = 256)
header.writeUInt8(0, 8); // palette colors
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // color planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14); // image byte size
header.writeUInt32LE(22, 18); // image offset
writeFileSync(process.argv[3], Buffer.concat([header, png]));

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

const root = resolve(process.cwd(), "public/icons");
const svg = readFileSync(resolve(root, "icon.svg"));

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
];

for (const { name, size, maskable } of sizes) {
  let pipeline = sharp(svg).resize(size, size, { fit: "contain", background: { r: 10, g: 12, b: 18, alpha: 1 } });
  if (maskable) {
    pipeline = pipeline.extend({
      top: Math.round(size * 0.08),
      bottom: Math.round(size * 0.08),
      left: Math.round(size * 0.08),
      right: Math.round(size * 0.08),
      background: { r: 10, g: 12, b: 18, alpha: 1 },
    });
  }
  const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(resolve(root, name), out);
  console.log(`Wrote public/icons/${name} (${size}px)`);
}

writeFileSync(resolve(process.cwd(), "public/apple-touch-icon.png"), readFileSync(resolve(root, "apple-touch-icon.png")));
console.log("Wrote public/apple-touch-icon.png");

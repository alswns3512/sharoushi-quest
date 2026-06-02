/**
 * generate-icons.mjs
 * 追加パッケージ不要でアプリアイコンを生成するスクリプト
 * 使い方: node scripts/generate-icons.mjs
 *
 * 出力: public/icon-192.png, public/icon-512.png
 * デザイン: 藍色背景(#0F172A) + 金色グラデーション円 + ⚖シンボル
 */

import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// ── PNG helper ───────────────────────────────────────────────
function uint32BE(n) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(n, 0);
  return buf;
}

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = uint32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = uint32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function makePNG(width, height, pixels /* Uint8Array, RGBA rows */) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = makeChunk('IHDR', Buffer.concat([
    uint32BE(width), uint32BE(height),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit RGB
  ]));

  // Raw scanlines with filter byte 0 (None)
  const rowSize = width * 3;
  const raw = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4;
      const ri = y * (rowSize + 1) + 1 + x * 3;
      raw[ri]     = pixels[pi];     // R
      raw[ri + 1] = pixels[pi + 1]; // G
      raw[ri + 2] = pixels[pi + 2]; // B
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ── Icon drawing ──────────────────────────────────────────────
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  const BG   = [0x0F, 0x17, 0x2A]; // #0F172A 藍色
  const GOLD = [0xF5, 0x9E, 0x0B]; // #F59E0B 金色
  const GOLD2= [0xFC, 0xD3, 0x4D]; // #FCD34D 薄金色
  const DARK = [0x07, 0x0E, 0x1A]; // 外枠用の暗い藍

  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = size * 0.5;

      // ── 背景 ──
      let color = BG;

      // ── 外側の暗い円（アイコン外周） ──
      if (dist < r * 0.98) {
        color = DARK;
      }

      // ── 金色のグラデーション円 ──
      const circleR = r * 0.82;
      if (dist < circleR) {
        const t = dist / circleR;
        color = [
          Math.round(GOLD[0] * (1 - t * 0.2) + GOLD2[0] * t * 0.2),
          Math.round(GOLD[1] * (1 - t * 0.2) + GOLD2[1] * t * 0.2),
          Math.round(GOLD[2] * (1 - t * 0.2) + GOLD2[2] * t * 0.2),
        ];
      }

      // ── 中央の藍色エリア（ロゴ形状） ──
      const innerR = r * 0.58;
      if (dist < innerR) {
        color = BG;
      }

      // ── ⚖ シンボルをジオメトリで描画 ──
      // 中央縦棒
      const poleW = size * 0.04;
      const poleTop = cy - size * 0.26;
      const poleBot = cy + size * 0.26;
      if (Math.abs(dx) < poleW && y > poleTop && y < poleBot) {
        color = GOLD;
      }

      // 横梁 (天秤の腕)
      const beamY = cy - size * 0.12;
      const beamHalfW = size * 0.26;
      const beamH = size * 0.025;
      if (Math.abs(dy - (beamY - cy)) < beamH && Math.abs(dx) < beamHalfW) {
        color = GOLD;
      }

      // 左皿
      const dishLX = cx - size * 0.25;
      const dishY  = cy + size * 0.04;
      const dishR  = size * 0.14;
      if (Math.sqrt((x - dishLX) ** 2 + (y - dishY) ** 2) < dishR) {
        color = GOLD2;
      }
      // 左皿線 (下側の弧っぽい強調)
      const dishLInnerR = dishR * 0.65;
      if (Math.sqrt((x - dishLX) ** 2 + (y - dishY) ** 2) < dishLInnerR) {
        color = BG;
      }

      // 右皿
      const dishRX = cx + size * 0.25;
      if (Math.sqrt((x - dishRX) ** 2 + (y - dishY) ** 2) < dishR) {
        color = GOLD2;
      }
      const dishRInnerR = dishR * 0.65;
      if (Math.sqrt((x - dishRX) ** 2 + (y - dishY) ** 2) < dishRInnerR) {
        color = BG;
      }

      // 台座
      const baseW = size * 0.14;
      const baseH = size * 0.03;
      const baseY = cy + size * 0.24;
      if (Math.abs(dx) < baseW && Math.abs(y - baseY) < baseH) {
        color = GOLD;
      }

      // 台座の足
      const footW = size * 0.06;
      const footTop = cy + size * 0.12;
      if (Math.abs(dx) < footW && y > footTop && y < baseY) {
        color = GOLD;
      }

      pixels[idx]     = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = 255;
    }
  }
  return pixels;
}

// ── Generate & save ───────────────────────────────────────────
console.log('🎨 アイコン生成中...');

for (const size of [192, 512]) {
  const pixels = drawIcon(size);
  const png = makePNG(size, size, pixels);
  const outPath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`  ✅ icon-${size}.png (${(png.length / 1024).toFixed(1)} KB) → ${outPath}`);
}

console.log('🎉 完了！public/icon-192.png と public/icon-512.png を作成しました');

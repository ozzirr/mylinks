import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require(
  path.resolve('node_modules/.pnpm/sharp@0.34.5/node_modules/sharp')
);

const SRC_DIR = path.resolve('public/brand');
const OUT_DIR = path.resolve('public/brand/white');
const FILES = [
  'logo-ms-porte-optimized.webp',
  'logo-olio-arsieni-optimized.webp',
  'logo-generale-elettrica-optimized.webp',
  'logo_odora.png'
];

// Any pixel lighter than this luma is treated as background (transparent).
const BG_LUMA_THRESHOLD = 235;
// Output tint — slight grey to avoid harshness; per-logo overridden below.
const DEFAULT_TINT = {r: 244, g: 244, b: 245};

const TINTS = {
  'logo-ms-porte-optimized.webp': {r: 244, g: 244, b: 245},
  'logo-olio-arsieni-optimized.webp': {r: 212, g: 212, b: 216},
  'logo-generale-elettrica-optimized.webp': {r: 244, g: 244, b: 245},
  'logo_odora.png': {r: 212, g: 212, b: 216}
};

async function whiten(file) {
  const inPath = path.join(SRC_DIR, file);
  const outPath = path.join(OUT_DIR, file.replace(/\.(webp|png|jpg|jpeg)$/i, '.webp'));

  const img = sharp(inPath).ensureAlpha();
  const {data, info} = await img.raw().toBuffer({resolveWithObject: true});
  const {width, height, channels} = info;
  const out = Buffer.alloc(width * height * 4);
  const tint = TINTS[file] ?? DEFAULT_TINT;

  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = channels === 4 ? data[o + 3] : 255;

    // Perceived luma.
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const p = i * 4;

    if (a < 8 || luma >= BG_LUMA_THRESHOLD) {
      out[p] = 0; out[p + 1] = 0; out[p + 2] = 0; out[p + 3] = 0;
      continue;
    }
    // Keep tint color; use inverse luma as alpha so darker source → more opaque.
    const alpha = Math.round(Math.min(255, (1 - luma / 255) * 255 * 1.15));
    out[p] = tint.r;
    out[p + 1] = tint.g;
    out[p + 2] = tint.b;
    out[p + 3] = Math.max(alpha, a === 255 ? alpha : Math.min(a, alpha));
  }

  await sharp(out, {raw: {width, height, channels: 4}})
    .webp({quality: 92, alphaQuality: 100})
    .toFile(outPath);

  console.log(`✓ ${file} → ${path.relative(process.cwd(), outPath)}`);
}

await fs.mkdir(OUT_DIR, {recursive: true});
for (const f of FILES) await whiten(f);
console.log('\nDone.');

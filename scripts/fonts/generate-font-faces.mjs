#!/usr/bin/env node
/**
 * Generate client/src/styles/fonts.css from fonts.registry.js
 */

import { writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const REGISTRY_URL = pathToFileURL(join(ROOT, 'client/src/config/fonts.registry.js')).href;
const OUT = join(ROOT, 'client/src/styles/fonts.css');

const { FONT_REGISTRY, MONO_FONT } = await import(REGISTRY_URL);

function variableFace(family, file, weightRange, sizeAdjust) {
  const metrics = sizeAdjust ? `\n  size-adjust: ${sizeAdjust};` : '';
  return `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weightRange};
  font-display: swap;
  src: url('../assets/fonts/${file}') format('woff2');${metrics}
}`;
}

function staticFace(family, file, weight, sizeAdjust) {
  const metrics = sizeAdjust ? `\n  size-adjust: ${sizeAdjust};` : '';
  return `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('../assets/fonts/${file}') format('woff2');${metrics}
}`;
}

const lines = [
  '/* AUTO-GENERATED — do not edit. Run: pnpm fonts:generate */',
  '',
];

for (const script of ['ltr', 'rtl']) {
  for (const font of FONT_REGISTRY[script]) {
    const adjust = font.metrics?.sizeAdjust;
    if (font.staticWeights?.length) {
      for (const sw of font.staticWeights) {
        lines.push(staticFace(font.family, sw.file, sw.weight, adjust));
        lines.push('');
      }
    } else if (font.file) {
      lines.push(variableFace(font.family, font.file, font.weightRange || '400 700', adjust));
      lines.push('');
    }
  }
}

lines.push(variableFace(MONO_FONT.family, MONO_FONT.file, MONO_FONT.weightRange));
lines.push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}`);

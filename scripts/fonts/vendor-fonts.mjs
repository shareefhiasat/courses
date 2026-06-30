#!/usr/bin/env node
/**
 * Copy OFL font woff2 files from @fontsource packages into client/src/assets/fonts/.
 * Run: pnpm fonts:vendor (from client/)
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const OUT_DIR = join(ROOT, 'client/src/assets/fonts');
const CLIENT_NODE = join(ROOT, 'client/node_modules');

/** @type {Array<{ dest: string, src: string }>} */
const FONT_MAP = [
  // LTR variable
  { dest: 'inter-latin-wght-normal.woff2', src: '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2' },
  { dest: 'ibm-plex-sans-latin-wght-normal.woff2', src: '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2' },
  { dest: 'source-sans-3-latin-wght-normal.woff2', src: '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2' },
  { dest: 'open-sans-latin-wght-normal.woff2', src: '@fontsource-variable/open-sans/files/open-sans-latin-wght-normal.woff2' },
  { dest: 'roboto-latin-wght-normal.woff2', src: '@fontsource-variable/roboto/files/roboto-latin-wght-normal.woff2' },
  { dest: 'nunito-sans-latin-wght-normal.woff2', src: '@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-normal.woff2' },
  { dest: 'work-sans-latin-wght-normal.woff2', src: '@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2' },
  { dest: 'plus-jakarta-sans-latin-wght-normal.woff2', src: '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2' },
  { dest: 'manrope-latin-wght-normal.woff2', src: '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2' },
  // LTR static
  { dest: 'lato-latin-400-normal.woff2', src: '@fontsource/lato/files/lato-latin-400-normal.woff2' },
  { dest: 'lato-latin-700-normal.woff2', src: '@fontsource/lato/files/lato-latin-700-normal.woff2' },
  // RTL variable
  { dest: 'noto-sans-arabic-arabic-wght-normal.woff2', src: '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2' },
  { dest: 'cairo-arabic-wght-normal.woff2', src: '@fontsource-variable/cairo/files/cairo-arabic-wght-normal.woff2' },
  { dest: 'readex-pro-arabic-wght-normal.woff2', src: '@fontsource-variable/readex-pro/files/readex-pro-arabic-wght-normal.woff2' },
  { dest: 'changa-arabic-wght-normal.woff2', src: '@fontsource-variable/changa/files/changa-arabic-wght-normal.woff2' },
  { dest: 'rubik-arabic-wght-normal.woff2', src: '@fontsource-variable/rubik/files/rubik-arabic-wght-normal.woff2' },
  // RTL static
  { dest: 'ibm-plex-sans-arabic-arabic-400-normal.woff2', src: '@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2' },
  { dest: 'ibm-plex-sans-arabic-arabic-500-normal.woff2', src: '@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2' },
  { dest: 'ibm-plex-sans-arabic-arabic-600-normal.woff2', src: '@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2' },
  { dest: 'ibm-plex-sans-arabic-arabic-700-normal.woff2', src: '@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2' },
  { dest: 'tajawal-arabic-400-normal.woff2', src: '@fontsource/tajawal/files/tajawal-arabic-400-normal.woff2' },
  { dest: 'tajawal-arabic-500-normal.woff2', src: '@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2' },
  { dest: 'tajawal-arabic-700-normal.woff2', src: '@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2' },
  { dest: 'almarai-arabic-400-normal.woff2', src: '@fontsource/almarai/files/almarai-arabic-400-normal.woff2' },
  { dest: 'almarai-arabic-700-normal.woff2', src: '@fontsource/almarai/files/almarai-arabic-700-normal.woff2' },
  { dest: 'harmattan-arabic-400-normal.woff2', src: '@fontsource/harmattan/files/harmattan-arabic-400-normal.woff2' },
  { dest: 'harmattan-arabic-600-normal.woff2', src: '@fontsource/harmattan/files/harmattan-arabic-600-normal.woff2' },
  { dest: 'harmattan-arabic-700-normal.woff2', src: '@fontsource/harmattan/files/harmattan-arabic-700-normal.woff2' },
  { dest: 'el-messiri-arabic-400-normal.woff2', src: '@fontsource/el-messiri/files/el-messiri-arabic-400-normal.woff2' },
  { dest: 'el-messiri-arabic-600-normal.woff2', src: '@fontsource/el-messiri/files/el-messiri-arabic-600-normal.woff2' },
  { dest: 'el-messiri-arabic-700-normal.woff2', src: '@fontsource/el-messiri/files/el-messiri-arabic-700-normal.woff2' },
  // Mono
  { dest: 'jetbrains-mono-latin-wght-normal.woff2', src: '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2' },
];

mkdirSync(OUT_DIR, { recursive: true });

let copied = 0;
let failed = 0;

for (const { dest, src } of FONT_MAP) {
  const from = join(CLIENT_NODE, src);
  const to = join(OUT_DIR, dest);
  if (!existsSync(from)) {
    console.error(`MISSING: ${src}`);
    failed++;
    continue;
  }
  copyFileSync(from, to);
  console.log(`OK ${dest}`);
  copied++;
}

console.log(`\nDone: ${copied} copied, ${failed} failed → ${OUT_DIR}`);
process.exit(failed > 0 ? 1 : 0);

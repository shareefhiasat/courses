#!/usr/bin/env node
/**
 * Replace common hardcoded font sizes with CSS token variables.
 * Usage: node scripts/fonts/migrate-font-sizes.mjs [dir...]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.argv[2] || 'client/src';
const TARGETS = process.argv.length > 2 ? process.argv.slice(2) : [ROOT];

const REPLACEMENTS = [
  [/fontSize:\s*14\b/g, "fontSize: 'var(--font-size-sm)'"],
  [/fontSize:\s*12\b/g, "fontSize: 'var(--font-size-xs)'"],
  [/fontSize:\s*13\b/g, "fontSize: 'var(--font-size-sm)'"],
  [/fontSize:\s*16\b/g, "fontSize: 'var(--font-size-md)'"],
  [/fontSize:\s*18\b/g, "fontSize: 'var(--font-size-lg)'"],
  [/fontSize:\s*24\b/g, "fontSize: 'var(--font-size-2xl)'"],
  [/fontSize:\s*'0\.75rem'/g, "fontSize: 'var(--font-size-xs)'"],
  [/fontSize:\s*"0\.75rem"/g, 'fontSize: "var(--font-size-xs)"'],
  [/fontSize:\s*'0\.8125rem'/g, "fontSize: 'var(--font-size-sm)'"],
  [/fontSize:\s*"0\.8125rem"/g, 'fontSize: "var(--font-size-sm)"'],
  [/fontSize:\s*'0\.875rem'/g, "fontSize: 'var(--font-size-sm)'"],
  [/fontSize:\s*"0\.875rem"/g, 'fontSize: "var(--font-size-sm)"'],
  [/fontSize:\s*'0\.9375rem'/g, "fontSize: 'var(--font-size-sm)'"],
  [/fontSize:\s*'1\.125rem'/g, "fontSize: 'var(--font-size-lg)'"],
  [/fontSize:\s*"1\.125rem"/g, 'fontSize: "var(--font-size-lg)"'],
  [/fontSize:\s*'1rem'/g, "fontSize: 'var(--font-size-md)'"],
  [/font-size:\s*0\.75rem/g, 'font-size: var(--font-size-xs)'],
  [/font-size:\s*0\.8125rem/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*0\.875rem/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*1\.125rem/g, 'font-size: var(--font-size-lg)'],
  [/font-size:\s*14px/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*12px/g, 'font-size: var(--font-size-xs)'],
  [/font-size:\s*13px/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*16px/g, 'font-size: var(--font-size-md)'],
];

const SKIP = ['node_modules', 'assets/fonts', 'styles/fonts.css'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.some((s) => p.includes(s)) || name.includes('.stories.')) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(jsx?|tsx?|css)$/.test(name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const target of TARGETS) {
  for (const file of walk(target)) {
    const original = readFileSync(file, 'utf8');
    let next = original;
    for (const [re, rep] of REPLACEMENTS) {
      next = next.replace(re, rep);
    }
    if (next !== original) {
      writeFileSync(file, next, 'utf8');
      changed++;
      console.log('updated', file);
    }
  }
}
console.log(`\n${changed} files updated`);

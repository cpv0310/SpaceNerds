#!/usr/bin/env node
// Aesthetic-pillar lint. Fails the build if any file under src/, dist/, or
// index.html crosses the B-1 / B-2 / B-3 boundaries defined in CLAUDE.md
// and specs/product-spec.md.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const ROOTS = ['src', 'dist', 'index.html', 'public'];

const FORBIDDEN_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.ico',
  '.svg',
  '.mp3',
  '.ogg',
  '.wav',
  '.m4a',
  '.flac',
  '.aac',
]);

const CSS_ANTIPATTERNS = [
  { pattern: /\bfilter\s*:\s*(blur|brightness|drop-shadow)/i, name: 'filter:blur/brightness/drop-shadow' },
  { pattern: /\bbox-shadow\s*:/i, name: 'box-shadow' },
  { pattern: /\bbackdrop-filter\s*:/i, name: 'backdrop-filter' },
];

/** @type {{ file: string; reason: string }[]} */
const violations = [];

function walk(path) {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isFile()) {
    checkFile(path);
    return;
  }
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(path)) {
    if (entry === '.' || entry === '..') continue;
    if (entry === 'node_modules' || entry.startsWith('.git')) continue;
    walk(join(path, entry));
  }
}

function checkFile(path) {
  const ext = extname(path).toLowerCase();
  if (FORBIDDEN_EXTS.has(ext)) {
    violations.push({
      file: relative(ROOT, path),
      reason: `forbidden asset extension ${ext}`,
    });
    return;
  }
  if (ext === '.html' || ext === '.css' || ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs') {
    try {
      const text = readFileSync(path, 'utf8');
      for (const { pattern, name } of CSS_ANTIPATTERNS) {
        if (pattern.test(text)) {
          violations.push({
            file: relative(ROOT, path),
            reason: `forbidden CSS pattern: ${name}`,
          });
        }
      }
    } catch {
      /* unreadable; skip */
    }
  }
}

for (const r of ROOTS) {
  walk(join(ROOT, r));
}

if (violations.length > 0) {
  console.error('aesthetic pillar violated:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.reason}`);
  }
  process.exit(1);
}

console.log('aesthetic check passed (' + countScanned() + ' files scanned)');

function countScanned() {
  let n = 0;
  function count(path) {
    if (!existsSync(path)) return;
    const stat = statSync(path);
    if (stat.isFile()) {
      n++;
      return;
    }
    if (!stat.isDirectory()) return;
    for (const entry of readdirSync(path)) {
      if (entry === 'node_modules' || entry.startsWith('.git')) continue;
      count(join(path, entry));
    }
  }
  for (const r of ROOTS) count(join(ROOT, r));
  return n;
}

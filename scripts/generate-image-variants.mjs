#!/usr/bin/env node
// Exists because next/image's runtime optimizer caches into .next/cache/images,
// inside the container. Cloud Run scales to zero, so that cache dies with every
// instance and each cold start re-encodes every card: ~1s TTFB per variant against
// ~0.28s for a plain static file.
//
// Output is gitignored; make and the npm pre-hooks both invoke this.

import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_FILE = path.join(process.cwd(), 'src', 'data', 'image-manifest.json');

// Rungs derived from the CSS slots the images actually occupy, not round numbers:
//   448 — desktop 3-up card (the flat `448px` branch of its `sizes`) at 1x
//   768 — phone card at 2x: a 412px viewport gives a 364px slot, so ~728px
//   896 — desktop 3-up card at 2x, and the 672px single-column slot at 1x
// A 1344 rung was measured and dropped: neither the mobile nor the desktop
// Lighthouse profile ever requested it, and it cost 792 KB of build output to
// serve only DPR-3 phones, which upscale from 896 imperceptibly.
const LADDER = [448, 768, 896];

const SOURCES = [
  { dir: 'projects', files: null },
  { dir: '', files: ['profile-dark.webp', 'profile-light.webp'] },
];

// Matches the grayscale treatment ProjectCard applies via CSS, so the placeholder
// does not flash in color and desaturate the moment the real image decodes.
const blurFor = (file) => sharp(file).resize(12).grayscale().webp({ quality: 30 }).toBuffer();

const mtime = async (file) => (await stat(file).catch(() => null))?.mtimeMs ?? Infinity;

// Mtimes alone are not a sufficient cache key: `mv` preserves them, so a renamed or
// deleted source leaves every survivor older than the manifest and the run gets
// skipped while the manifest still points at the old name. The key set must match
// too, or the loader falls through to the unresized original.
async function isUpToDate(expectedKeys, sourcePaths) {
  const built = await mtime(OUT_FILE);
  if (built === Infinity) return false;

  const previous = await readFile(OUT_FILE, 'utf8')
    .then((raw) => Object.keys(JSON.parse(raw)))
    .catch(() => null);
  if (!previous) return false;
  if (previous.length !== expectedKeys.length) return false;
  if (previous.some((key, i) => key !== expectedKeys[i])) return false;

  const self = fileURLToPath(import.meta.url);
  const newest = Math.max(...(await Promise.all([...sourcePaths, self].map(mtime))));
  return newest !== Infinity && newest <= built;
}

const publicPathFor = (dir, name) => `${dir ? `/${dir}` : ''}/${name}`;

const manifest = {};
const plan = [];

for (const { dir, files } of SOURCES) {
  const srcDir = path.join(PUBLIC_DIR, dir);
  const names = files ?? (await readdir(srcDir)).filter((f) => f.endsWith('.webp')).sort();
  plan.push({ dir, srcDir, optDir: path.join(srcDir, 'opt'), names });
}

// Same order the manifest is written in, so isUpToDate can compare positionally.
const expectedKeys = plan.flatMap((p) => p.names.map((n) => publicPathFor(p.dir, n)));
const sourcePaths = plan.flatMap((p) => p.names.map((n) => path.join(p.srcDir, n)));

if (await isUpToDate(expectedKeys, sourcePaths)) {
  console.log('Image variants already up to date');
  process.exit(0);
}

for (const { dir, srcDir, optDir, names } of plan) {
  // Wipe first so variants of a deleted or renamed source cannot linger.
  await rm(optDir, { recursive: true, force: true });
  await mkdir(optDir, { recursive: true });

  for (const name of names) {
    const srcPath = path.join(srcDir, name);
    const { width: srcWidth } = await sharp(srcPath).metadata();
    const base = name.replace(/\.webp$/, '');

    // Clamped so a rung wider than the source never upscales.
    const widths = [...new Set(LADDER.map((w) => Math.min(w, srcWidth)))].sort((a, b) => a - b);

    for (const w of widths) {
      const buf = await sharp(srcPath).resize(w).webp({ quality: 72 }).toBuffer();
      await writeFile(path.join(optDir, `${base}-${w}.webp`), buf);
    }

    manifest[publicPathFor(dir, name)] = {
      blur: `data:image/webp;base64,${(await blurFor(srcPath)).toString('base64')}`,
      widths,
    };
  }
}

await writeFile(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

const total = Object.values(manifest).reduce((n, e) => n + e.widths.length, 0);
console.log(`Wrote ${total} variants for ${Object.keys(manifest).length} sources`);

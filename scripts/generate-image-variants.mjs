#!/usr/bin/env node
// Pre-renders every responsive variant next/image would otherwise build on demand,
// plus the LQIP blur for each source, into src/data/image-manifest.json.
//
// Why this exists: the runtime optimizer writes to .next/cache/images inside the
// container. Cloud Run scales to zero, so that cache dies with every instance and
// each cold start re-encodes all twenty cards from scratch — measured at ~1s TTFB
// per variant against ~0.28s for a plain static file. Encoding at build time and
// serving the results as static assets removes the optimizer from the hot path.
//
// Output is gitignored. Make rebuilds it whenever a source image changes, and the
// npm prebuild hook covers the Docker path, which never goes through Make.

import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
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

// Sources live flat in public/; variants go in a sibling opt/ dir so the originals
// stay recognisable as the inputs rather than as anything the site still serves.
const SOURCES = [
  { dir: 'projects', files: null },
  { dir: '', files: ['ashley-gen-2.webp'] },
];

// Matches the grayscale treatment ProjectCard applies via CSS, so the placeholder
// does not flash in colour and desaturate the moment the real image decodes.
const blurFor = (file) => sharp(file).resize(12).grayscale().webp({ quality: 30 }).toBuffer();

const mtime = async (file) => (await stat(file).catch(() => null))?.mtimeMs ?? Infinity;

// Every npm entry point that compiles the app now runs this first, so an
// unconditional re-encode would tax `npm test` and `npm run dev` on every
// invocation. Make already tracks staleness for its own targets; this makes the
// npm hooks equally cheap when nothing has moved.
async function isUpToDate(sourcePaths) {
  const built = await mtime(OUT_FILE);
  if (built === Infinity) return false;
  const self = fileURLToPath(import.meta.url);
  const newest = Math.max(...(await Promise.all([...sourcePaths, self].map(mtime))));
  return newest !== Infinity && newest <= built;
}

const manifest = {};
const plan = [];

for (const { dir, files } of SOURCES) {
  const srcDir = path.join(PUBLIC_DIR, dir);
  const names = files ?? (await readdir(srcDir)).filter((f) => f.endsWith('.webp')).sort();
  plan.push({ dir, srcDir, optDir: path.join(srcDir, 'opt'), names });
}

if (await isUpToDate(plan.flatMap((p) => p.names.map((n) => path.join(p.srcDir, n))))) {
  console.log('Image variants already up to date');
  process.exit(0);
}

for (const { dir, srcDir, optDir, names } of plan) {
  // Wipe first so variants of a deleted or renamed source cannot linger and get
  // served long after the image they came from is gone.
  await rm(optDir, { recursive: true, force: true });
  await mkdir(optDir, { recursive: true });

  for (const name of names) {
    const srcPath = path.join(srcDir, name);
    const { width: srcWidth } = await sharp(srcPath).metadata();
    const base = name.replace(/\.webp$/, '');

    // Never upscale: a ladder rung wider than the source would cost bytes for
    // pixels that were never there.
    const widths = [...new Set(LADDER.map((w) => Math.min(w, srcWidth)))].sort((a, b) => a - b);

    for (const w of widths) {
      const buf = await sharp(srcPath).resize(w).webp({ quality: 72 }).toBuffer();
      await writeFile(path.join(optDir, `${base}-${w}.webp`), buf);
    }

    const publicPath = `${dir ? `/${dir}` : ''}/${name}`;
    manifest[publicPath] = {
      blur: `data:image/webp;base64,${(await blurFor(srcPath)).toString('base64')}`,
      widths,
    };
  }
}

await writeFile(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

const total = Object.values(manifest).reduce((n, e) => n + e.widths.length, 0);
console.log(`Wrote ${total} variants for ${Object.keys(manifest).length} sources`);

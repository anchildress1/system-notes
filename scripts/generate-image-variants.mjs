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

// Rungs derived from the CSS slots the images actually occupy, not round numbers:
//   448 — desktop 3-up card (the flat `448px` branch of its `sizes`) at 1x
//   768 — phone card at 2x: a 412px viewport gives a 364px slot, so ~728px
//   896 — desktop 3-up card at 2x, and the 672px single-column slot at 1x
// A 1344 rung was measured and dropped: neither the mobile nor the desktop
// Lighthouse profile ever requested it, and it cost 792 KB of build output to
// serve only DPR-3 phones, which upscale from 896 imperceptibly.
export const LADDER = [448, 768, 896];

export const SOURCES = [
  { dir: 'projects', files: null },
  { dir: '', files: ['profile-dark.webp', 'profile-light.webp'] },
];

// Matches the grade `.taped img` applies via CSS, so the placeholder does not
// shift colour the moment the real image decodes.
//
// This used to be `.grayscale()`, matching a treatment ProjectCard applied back
// when images were styled per page. That treatment is gone — every image on the
// site now composes `.taped`, whose only grade is `saturate(0.8) contrast(1.06)`
// — so a fully grey placeholder was popping to near-full colour on decode: the
// exact flash the grayscale existed to prevent, inverted.
//
// Saturation only. The 6% contrast bump is invisible on a 12px source blown up
// to fill its slot, and reproducing it here would mean hand-rolling a linear
// ramp for something nobody can see.
export const variantWidths = (sourceWidth, ladder = LADDER) =>
  [...new Set(ladder.map((width) => Math.min(width, sourceWidth)))].sort((a, b) => a - b);

export const blurFor = (sharpFactory, file) =>
  sharpFactory(file).resize(12).modulate({ saturation: 0.8 }).webp({ quality: 30 }).toBuffer();

const mtime = async (statFile, file) =>
  (await statFile(file).catch(() => null))?.mtimeMs ?? Infinity;

// Mtimes alone are not a sufficient cache key: `mv` preserves them, so a renamed or
// deleted source leaves every survivor older than the manifest and the run gets
// skipped while the manifest still points at the old name. The key set must match
// too, or the loader falls through to the unresized original.
export async function isUpToDate({
  expectedKeys,
  sourcePaths,
  outFile,
  scriptPath,
  readManifest,
  statFile,
}) {
  const built = await mtime(statFile, outFile);
  if (built === Infinity) return false;

  const previous = await readManifest(outFile, 'utf8')
    .then((raw) => Object.keys(JSON.parse(raw)))
    .catch(() => null);
  if (!previous) return false;
  if (previous.length !== expectedKeys.length) return false;
  if (previous.some((key, i) => key !== expectedKeys[i])) return false;

  const newest = Math.max(
    ...(await Promise.all([...sourcePaths, scriptPath].map((file) => mtime(statFile, file))))
  );
  return newest !== Infinity && newest <= built;
}

export const publicPathFor = (dir, name) => `${dir ? `/${dir}` : ''}/${name}`;

export async function generateImageVariants({
  cwd = process.cwd(),
  fs = { mkdir, readdir, readFile, rm, stat, writeFile },
  ladder = LADDER,
  log = console.log,
  sharpFactory = sharp,
  sources = SOURCES,
  scriptPath = fileURLToPath(import.meta.url),
} = {}) {
  const publicDir = path.join(cwd, 'public');
  const outFile = path.join(cwd, 'src', 'data', 'image-manifest.json');
  const plan = await Promise.all(
    sources.map(async ({ dir, files }) => {
      const srcDir = path.join(publicDir, dir);
      const names =
        files ?? (await fs.readdir(srcDir)).filter((file) => file.endsWith('.webp')).sort();
      return { dir, srcDir, optDir: path.join(srcDir, 'opt'), names };
    })
  );

  // Same order the manifest is written in, so isUpToDate can compare positionally.
  const expectedKeys = plan.flatMap((entry) =>
    entry.names.map((name) => publicPathFor(entry.dir, name))
  );
  const sourcePaths = plan.flatMap((entry) =>
    entry.names.map((name) => path.join(entry.srcDir, name))
  );

  if (
    await isUpToDate({
      expectedKeys,
      sourcePaths,
      outFile,
      scriptPath,
      readManifest: fs.readFile,
      statFile: fs.stat,
    })
  ) {
    log('Image variants already up to date');
    return { status: 'current', variants: 0 };
  }

  const manifest = {};
  for (const { dir, srcDir, optDir, names } of plan) {
    // Wipe first so variants of a deleted or renamed source cannot linger.
    await fs.rm(optDir, { recursive: true, force: true });
    await fs.mkdir(optDir, { recursive: true });

    for (const name of names) {
      const srcPath = path.join(srcDir, name);
      const { width: srcWidth } = await sharpFactory(srcPath).metadata();
      if (!srcWidth) throw new Error(`Missing width metadata for ${srcPath}`);
      const base = name.replace(/\.webp$/, '');
      const widths = variantWidths(srcWidth, ladder);

      for (const width of widths) {
        const buffer = await sharpFactory(srcPath).resize(width).webp({ quality: 72 }).toBuffer();
        await fs.writeFile(path.join(optDir, `${base}-${width}.webp`), buffer);
      }

      manifest[publicPathFor(dir, name)] = {
        blur: `data:image/webp;base64,${(await blurFor(sharpFactory, srcPath)).toString('base64')}`,
        widths,
      };
    }
  }

  await fs.writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const variants = Object.values(manifest).reduce((total, entry) => total + entry.widths.length, 0);
  log(`Wrote ${variants} variants for ${Object.keys(manifest).length} sources`);
  return { status: 'written', variants };
}

if (import.meta.main) await generateImageVariants();

// The rasters are renders of src/app/icon.svg, never hand-drawn. They drifted
// once: the SVG went gold and icon.png, apple-icon.png and favicon.ico kept the
// retired pink (#ff3d9a) on a #100b11 ground, which is what a browser tab, a
// bookmark and the PWA install card each showed for a full release. Regenerate
// here instead of editing any of them.
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const SOURCE = path.join(ROOT, 'src/app/icon.svg');

/** Sizes packed into favicon.ico, smallest first. */
export const ICO_SIZES = [16, 32, 48, 64];

export const PNG_TARGETS = [
  { file: 'src/app/icon.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
];

const DEFAULT_RUNTIME = {
  fs: { mkdir, writeFile },
  log: process.stdout,
  sharpFactory: sharp,
};

/**
 * Rasterizes the source mark at one edge length.
 *
 * @param size Output width and height in pixels.
 * @returns The encoded PNG.
 */
export async function render(size, source = SOURCE, sharpFactory = sharp) {
  return sharpFactory(source, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Packs PNGs into a single ICO container.
 *
 * @param entries Rendered PNGs paired with the edge length each was drawn at.
 * @returns The encoded ICO.
 */
export function packIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    // 0 means 256 in this field, which is why it is a byte and not a short.
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size: none, the payload is a PNG
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map(({ png }) => png)]);
}

export async function generateIcons(
  { pngTargets = PNG_TARGETS, root = ROOT, source = SOURCE, icoSizes = ICO_SIZES } = {},
  { fs, log, sharpFactory } = DEFAULT_RUNTIME
) {
  for (const { file, size } of pngTargets) {
    const out = path.join(root, file);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, await render(size, source, sharpFactory));
    log.write(`${file} ${size}x${size}\n`);
  }

  const icoEntries = await Promise.all(
    icoSizes.map(async (size) => ({ size, png: await render(size, source, sharpFactory) }))
  );
  await fs.writeFile(path.join(root, 'public/favicon.ico'), packIco(icoEntries));
  log.write(`public/favicon.ico ${icoSizes.join(', ')}\n`);
}

if (import.meta.main) await generateIcons();

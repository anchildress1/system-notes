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

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'src/app/icon.svg');

/** Sizes packed into favicon.ico, smallest first. */
const ICO_SIZES = [16, 32, 48, 64];

const PNG_TARGETS = [
  { file: 'src/app/icon.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
];

/**
 * Rasterizes the source mark at one edge length.
 *
 * @param size Output width and height in pixels.
 * @returns The encoded PNG.
 */
async function render(size) {
  return sharp(SOURCE, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
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

export async function generateIcons() {
  for (const { file, size } of PNG_TARGETS) {
    const out = path.join(ROOT, file);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, await render(size));
    process.stdout.write(`${file} ${size}x${size}\n`);
  }

  const icoEntries = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, png: await render(size) }))
  );
  await writeFile(path.join(ROOT, 'public/favicon.ico'), packIco(icoEntries));
  process.stdout.write(`public/favicon.ico ${ICO_SIZES.join(', ')}\n`);
}

if (import.meta.main) await generateIcons();

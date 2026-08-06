#!/usr/bin/env node
// Regenerates src/data/blur-placeholders.json from public/projects/*.webp.
// Project images are referenced by runtime path string, so next/image cannot
// auto-derive a blurDataURL the way it does for statically imported files.
// Run this after adding or replacing a project image; commit the output.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'projects');
const OUT_FILE = path.join(process.cwd(), 'src', 'data', 'blur-placeholders.json');

// Grayscaled to match the treatment ProjectCard applies to the loaded image, so
// the placeholder does not flash in colour and desaturate on decode. The rest of
// that filter chain stays in CSS (.imageBlur) rather than being baked in twice.
const preview = (file) => sharp(file).resize(12).grayscale().webp({ quality: 30 }).toBuffer();

const files = (await readdir(IMAGE_DIR)).filter((f) => f.endsWith('.webp')).sort();

const entries = await Promise.all(
  files.map(async (f) => {
    const buf = await preview(path.join(IMAGE_DIR, f));
    return [`/projects/${f}`, `data:image/webp;base64,${buf.toString('base64')}`];
  })
);

await writeFile(OUT_FILE, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
console.log(`Wrote ${entries.length} placeholders to ${path.relative(process.cwd(), OUT_FILE)}`);

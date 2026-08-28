import { Buffer } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';
import { generateIcons, packIco, render } from '../../../scripts/generate-icons.mjs';

describe('icon generator', () => {
  it('packs PNG entries into a valid ICO directory with stable offsets', () => {
    const first = Buffer.from([1, 2, 3]);
    const second = Buffer.from([4, 5]);
    const ico = packIco([
      { size: 16, png: first },
      { size: 32, png: second },
    ]);

    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(2);
    expect(ico.readUInt8(6)).toBe(16);
    expect(ico.readUInt32LE(14)).toBe(first.length);
    expect(ico.readUInt32LE(18)).toBe(38);
    expect(ico.readUInt32LE(34)).toBe(38 + first.length);
    expect(ico.subarray(38)).toEqual(Buffer.concat([first, second]));
  });

  it('renders and writes every asset through injected image and filesystem seams', async () => {
    const chain = {
      png: vi.fn(() => chain),
      resize: vi.fn(() => chain),
      toBuffer: vi.fn(async () => Buffer.from('png')),
    };
    const sharpFactory = vi.fn(() => chain);
    const fs = { mkdir: vi.fn(async () => undefined), writeFile: vi.fn(async () => undefined) };
    const log = { write: vi.fn() };

    await expect(render(32, '/icon.svg', sharpFactory)).resolves.toEqual(Buffer.from('png'));
    expect(sharpFactory).toHaveBeenCalledWith('/icon.svg', { density: 384 });
    expect(chain.resize).toHaveBeenCalledWith(32, 32);

    await generateIcons({
      fs,
      icoSizes: [16, 256],
      log,
      pngTargets: [{ file: 'src/app/icon.png', size: 512 }],
      root: '/portfolio',
      sharpFactory,
      source: '/portfolio/src/app/icon.svg',
    });

    expect(fs.mkdir).toHaveBeenCalledWith('/portfolio/src/app', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith('/portfolio/src/app/icon.png', Buffer.from('png'));
    expect(fs.writeFile).toHaveBeenCalledWith('/portfolio/public/favicon.ico', expect.any(Buffer));
    expect(log.write).toHaveBeenCalledWith('public/favicon.ico 16, 256\n');
  });
});

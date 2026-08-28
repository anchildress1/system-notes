import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { packIco } from '../../../scripts/generate-icons.mjs';

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
});

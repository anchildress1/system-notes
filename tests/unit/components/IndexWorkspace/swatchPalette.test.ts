import { describe, expect, it } from 'vitest';
import {
  AWARD_SWATCH,
  assignSwatches,
  SWATCH_MIN_LIGHTNESS_DELTA,
  SWATCH_PALETTE,
  SWATCH_SURFACE_LIGHTNESS,
  SWATCH_TOKEN_LIGHTNESS,
  type SwatchTheme,
  swatchClearsSurface,
  swatchLightness,
} from '@/components/IndexWorkspace/swatchPalette';

const THEMES: SwatchTheme[] = ['dark', 'light'];

describe('swatchLightness', () => {
  it('reads the lightness out of a percent literal', () => {
    expect(swatchLightness('oklch(74% 0.055 330)')).toBe(74);
    expect(swatchLightness('oklch(50% 0.06 330)')).toBe(50);
  });

  it('normalizes a unitless literal onto the same 0-100 scale', () => {
    // oklch accepts both forms. Read as-is, oklch(0.83 ...) reports a lightness
    // of 0.83 — no error, no failed floor, just a near-black swatch declared
    // valid. Both spellings of the same color must agree.
    expect(swatchLightness('oklch(0.83 0.15 80)')).toBe(83);
    expect(swatchLightness('oklch(0.155 0.006 265)')).toBeCloseTo(15.5);
    expect(swatchLightness('oklch(0.74 0.055 330)')).toBe(swatchLightness('oklch(74% 0.055 330)'));
  });

  it('resolves a reviewed token per theme', () => {
    expect(swatchLightness('var(--k-award)', 'dark')).toBe(93);
    expect(swatchLightness('var(--k-award)', 'light')).toBe(62);
    expect(swatchLightness('var(--k-note)', 'dark')).toBe(74);
    expect(swatchLightness('var(--k-note)', 'light')).toBe(46);
  });

  it('reads the dark board when no theme is named', () => {
    expect(swatchLightness('var(--k-decision)')).toBe(84);
  });

  it('tolerates whitespace inside the var() call', () => {
    expect(swatchLightness('var( --k-principle )')).toBe(56);
  });

  it('reads a fractional lightness', () => {
    expect(swatchLightness('oklch(15.5% 0.029 330)')).toBe(15.5);
  });

  it('rejects a token nobody reviewed', () => {
    // --void is the board's own surface. Letting it through is exactly how a
    // category ended up indistinguishable from the board behind it.
    expect(() => swatchLightness('var(--void)')).toThrow(/Unreviewed swatch token/);
    expect(() => swatchLightness('var(--panel)')).toThrow(/Unreviewed swatch token/);
    // Byte-identical to --k-decision in dark; two ranks would paint the same.
    expect(() => swatchLightness('var(--flag)')).toThrow(/Unreviewed swatch token/);
  });

  it('rejects a color space it cannot reason about', () => {
    expect(() => swatchLightness('#ff00ff')).toThrow(/Unrecognized swatch/);
    expect(() => swatchLightness('rgb(255 0 255)')).toThrow(/Unrecognized swatch/);
    expect(() => swatchLightness('transparent')).toThrow(/Unrecognized swatch/);
    expect(() => swatchLightness('')).toThrow(/Unrecognized swatch/);
  });
});

describe('SWATCH_PALETTE', () => {
  it.each(THEMES)('keeps every slot clear of the %s board surface', (theme) => {
    for (const swatch of SWATCH_PALETTE) {
      expect(swatchClearsSurface(swatch, theme), `${swatch} on ${theme}`).toBe(true);
    }
  });

  it('never reaches for a background token', () => {
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch).not.toMatch(/--void|--panel/);
    }
  });

  it('holds only tokens, never a literal', () => {
    // A literal cannot follow a theme: it would paint the same color against a
    // dark board and a light one, and the light board is where that is fatal.
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch, swatch).toMatch(/^var\(--[\w-]+\)$/);
    }
  });

  it('keeps the award tone out of the rank palette', () => {
    // As slot 0 it collided with whichever category ranked first, so the awards
    // and the largest category painted the same color.
    expect(SWATCH_PALETTE).not.toContain(AWARD_SWATCH);
  });

  it.each(THEMES)('keeps the award tone clear of the %s surface as well', (theme) => {
    expect(swatchClearsSurface(AWARD_SWATCH, theme)).toBe(true);
  });

  it.each(THEMES)('keeps the award tone distinct from every rank in %s', (theme) => {
    const award = swatchLightness(AWARD_SWATCH, theme);
    for (const swatch of SWATCH_PALETTE) {
      expect(Math.abs(award - swatchLightness(swatch, theme)), swatch).toBeGreaterThanOrEqual(4);
    }
  });

  it('holds enough slots that adjacent ranks differ', () => {
    expect(SWATCH_PALETTE.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SWATCH_PALETTE).size).toBe(SWATCH_PALETTE.length);
  });

  it.each(THEMES)('resolves every slot to a distinct %s tone', (theme) => {
    // Distinctness by resolved value, not by token name. Two names pointing at
    // the same color pass a string-uniqueness check while painting one board.
    const resolved = SWATCH_PALETTE.map((s) => swatchLightness(s, theme));
    const distinctEnough = resolved.every((l, i) =>
      resolved.every((other, j) => i === j || Math.abs(l - other) >= 4)
    );
    expect(distinctEnough, `${theme}: ${resolved.join(', ')}`).toBe(true);
  });

  it.each(THEMES)('sits every reviewed token clear of the %s surface too', (theme) => {
    for (const token of Object.keys(SWATCH_TOKEN_LIGHTNESS)) {
      expect(swatchClearsSurface(`var(${token})`, theme), `${token} on ${theme}`).toBe(true);
    }
  });

  it('states both board surfaces on the 0-100 scale', () => {
    // The whole delta comparison is meaningless if a surface is stored 0-1.
    for (const theme of THEMES) {
      expect(SWATCH_SURFACE_LIGHTNESS[theme]).toBeGreaterThan(1);
      expect(SWATCH_SURFACE_LIGHTNESS[theme]).toBeLessThanOrEqual(100);
    }
    expect(SWATCH_MIN_LIGHTNESS_DELTA).toBeGreaterThan(1);
  });
});

describe('swatchClearsSurface', () => {
  it('fails a swatch that sits on top of the dark board', () => {
    expect(swatchClearsSurface('oklch(20% 0.02 265)', 'dark')).toBe(false);
  });

  it('fails a swatch that sits on top of the light board', () => {
    // The direction inverts: on a near-white board a pale swatch is the failure.
    expect(swatchClearsSurface('oklch(90% 0.02 265)', 'light')).toBe(false);
  });

  it('passes the same tone the other way round on each board', () => {
    expect(swatchClearsSurface('oklch(90% 0.02 265)', 'dark')).toBe(true);
    expect(swatchClearsSurface('oklch(20% 0.02 265)', 'light')).toBe(true);
  });
});

describe('assignSwatches', () => {
  const isAward = (value: string) => /award/i.test(value);

  it('walks the rank palette in order', () => {
    const assigned = assignSwatches(['a', 'b', 'c', 'd'], isAward);
    expect([...assigned.values()]).toEqual([...SWATCH_PALETTE]);
  });

  it('gives every award category the reserved tone', () => {
    const assigned = assignSwatches(['Awards ★', 'Decisions'], isAward);
    expect(assigned.get('Awards ★')).toBe(AWARD_SWATCH);
  });

  it('never lets an award consume a rank slot', () => {
    // The regression: with awards ranked third, the fifth category wrapped back
    // onto slot 0 and painted identically to the first.
    const assigned = assignSwatches(
      ['Decisions', 'Architecture', 'Practice', 'Awards ★', 'Principles'],
      isAward
    );
    expect(assigned.get('Principles')).not.toBe(assigned.get('Decisions'));
    expect(assigned.get('Principles')).toBe(SWATCH_PALETTE[3]);
  });

  it('assigns a distinct tone to every category up to the palette size', () => {
    const assigned = assignSwatches(
      ['Decisions', 'Architecture', 'Practice', 'Awards ★', 'Principles'],
      isAward
    );
    expect(new Set(assigned.values()).size).toBe(assigned.size);
  });

  it('wraps only once the rank palette is genuinely exhausted', () => {
    const values = ['a', 'b', 'c', 'd', 'e'];
    const assigned = assignSwatches(values, isAward);
    expect(assigned.get('e')).toBe(assigned.get('a'));
  });

  it('ignores a repeated category rather than advancing the rank', () => {
    const assigned = assignSwatches(['a', 'a', 'b'], isAward);
    expect(assigned.size).toBe(2);
    expect(assigned.get('b')).toBe(SWATCH_PALETTE[1]);
  });

  it('returns nothing for an empty ranking', () => {
    expect(assignSwatches([], isAward).size).toBe(0);
  });

  it('handles a ranking that is nothing but awards', () => {
    const assigned = assignSwatches(['Award', 'Awards ★'], isAward);
    expect([...assigned.values()]).toEqual([AWARD_SWATCH, AWARD_SWATCH]);
  });
});

import { describe, expect, it } from 'vitest';
import {
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

  it('normalises a unitless literal onto the same 0-100 scale', () => {
    // oklch accepts both forms. Read as-is, oklch(0.83 ...) reports a lightness
    // of 0.83 — no error, no failed floor, just a near-black swatch declared
    // valid. Both spellings of the same colour must agree.
    expect(swatchLightness('oklch(0.83 0.15 80)')).toBe(83);
    expect(swatchLightness('oklch(0.155 0.006 265)')).toBeCloseTo(15.5);
    expect(swatchLightness('oklch(0.74 0.055 330)')).toBe(swatchLightness('oklch(74% 0.055 330)'));
  });

  it('resolves a reviewed token per theme', () => {
    expect(swatchLightness('var(--k-award)', 'dark')).toBe(93);
    expect(swatchLightness('var(--k-award)', 'light')).toBe(62);
    expect(swatchLightness('var(--k-note)', 'dark')).toBe(66);
    expect(swatchLightness('var(--k-note)', 'light')).toBe(46);
  });

  it('reads the dark board when no theme is named', () => {
    expect(swatchLightness('var(--k-decision)')).toBe(83);
  });

  it('tolerates whitespace inside the var() call', () => {
    expect(swatchLightness('var( --k-principle )')).toBe(72);
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

  it('rejects a colour space it cannot reason about', () => {
    expect(() => swatchLightness('#ff00ff')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('rgb(255 0 255)')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('transparent')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('')).toThrow(/Unrecognised swatch/);
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
    // A literal cannot follow a theme: it would paint the same colour against a
    // dark board and a light one, and the light board is where that is fatal.
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch, swatch).toMatch(/^var\(--[\w-]+\)$/);
    }
  });

  it('holds enough slots that adjacent ranks differ', () => {
    expect(SWATCH_PALETTE.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SWATCH_PALETTE).size).toBe(SWATCH_PALETTE.length);
  });

  it.each(THEMES)('resolves every slot to a distinct %s tone', (theme) => {
    // Distinctness by resolved value, not by token name. Two names pointing at
    // the same colour pass a string-uniqueness check while painting one board.
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

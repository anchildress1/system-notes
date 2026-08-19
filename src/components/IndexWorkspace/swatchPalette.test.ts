import { describe, expect, it } from 'vitest';
import {
  SWATCH_LIGHTNESS_FLOOR,
  SWATCH_PALETTE,
  SWATCH_TOKEN_LIGHTNESS,
  swatchLightness,
} from './swatchPalette';

describe('swatchLightness', () => {
  it('reads the lightness out of a literal oklch swatch', () => {
    expect(swatchLightness('oklch(74% 0.055 330)')).toBe(74);
    expect(swatchLightness('oklch(50% 0.06 330)')).toBe(50);
  });

  it('resolves a reviewed token to its lightness', () => {
    expect(swatchLightness('var(--neon)')).toBe(72);
    expect(swatchLightness('var(--paper)')).toBe(95);
  });

  it('tolerates whitespace inside the var() call', () => {
    expect(swatchLightness('var( --neon )')).toBe(72);
  });

  it('reads a fractional lightness', () => {
    expect(swatchLightness('oklch(15.5% 0.029 330)')).toBe(15.5);
  });

  it('rejects a token nobody reviewed', () => {
    // --void-soft is the board's own surface. Letting it through is exactly how
    // a category ended up indistinguishable from the board behind it.
    expect(() => swatchLightness('var(--void-soft)')).toThrow(/Unreviewed swatch token/);
    expect(() => swatchLightness('var(--void)')).toThrow(/Unreviewed swatch token/);
  });

  it('rejects a colour space it cannot reason about', () => {
    expect(() => swatchLightness('#ff00ff')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('rgb(255 0 255)')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('transparent')).toThrow(/Unrecognised swatch/);
    expect(() => swatchLightness('')).toThrow(/Unrecognised swatch/);
  });
});

describe('SWATCH_PALETTE', () => {
  it('keeps every slot clear of the board surface', () => {
    for (const swatch of SWATCH_PALETTE) {
      expect(swatchLightness(swatch), swatch).toBeGreaterThanOrEqual(SWATCH_LIGHTNESS_FLOOR);
    }
  });

  it('never reaches for a background token', () => {
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch).not.toMatch(/--void/);
    }
  });

  it('holds enough slots that adjacent ranks differ', () => {
    expect(SWATCH_PALETTE.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SWATCH_PALETTE).size).toBe(SWATCH_PALETTE.length);
  });

  it('sits every reviewed token above the floor too', () => {
    for (const [token, lightness] of Object.entries(SWATCH_TOKEN_LIGHTNESS)) {
      expect(lightness, token).toBeGreaterThanOrEqual(SWATCH_LIGHTNESS_FLOOR);
    }
  });
});

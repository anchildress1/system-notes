import { describe, expect, it } from 'vitest';
import {
  AWARD_SWATCH,
  assignSwatches,
  SWATCH_PALETTE,
} from '@/components/IndexWorkspace/swatchPalette';

describe('SWATCH_PALETTE', () => {
  it('holds enough slots that adjacent ranks differ', () => {
    expect(SWATCH_PALETTE.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SWATCH_PALETTE).size).toBe(SWATCH_PALETTE.length);
  });

  it('holds only tokens, never a literal', () => {
    // A literal cannot follow a theme: it would paint the same color against a
    // dark board and a light one, and the light board is where that is fatal.
    // This asserts the SHAPE of an entry, not the color it resolves to — what
    // the tones are is globals.css's business and is not restated here.
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch, swatch).toMatch(/^var\(--[\w-]+\)$/);
    }
  });

  it('never reaches for a background token', () => {
    for (const swatch of SWATCH_PALETTE) {
      expect(swatch).not.toMatch(/--void|--panel/);
    }
  });

  it('keeps the award tone out of the rank palette', () => {
    // As slot 0 it collided with whichever category ranked first, so the awards
    // and the largest category painted the same color.
    expect(SWATCH_PALETTE).not.toContain(AWARD_SWATCH);
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

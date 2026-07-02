import { describe, it, expect } from 'vitest';
import { accentForPosition, CARD_ACCENTS } from '../cardAccent';

describe('accentForPosition', () => {
  it('maps the first four 1-indexed positions to the accent rotation in order', () => {
    expect(accentForPosition(1)).toBe('pink');
    expect(accentForPosition(2)).toBe('violet');
    expect(accentForPosition(3)).toBe('teal');
    expect(accentForPosition(4)).toBe('gold');
  });

  it('wraps back to the start after a full cycle', () => {
    expect(accentForPosition(5)).toBe('pink');
    expect(accentForPosition(8)).toBe('gold');
    expect(accentForPosition(9)).toBe('pink');
  });

  it('clamps non-positive positions to the first accent instead of indexing negatively', () => {
    expect(accentForPosition(0)).toBe('pink');
    expect(accentForPosition(-3)).toBe('pink');
  });

  it('always returns a value from the accent set', () => {
    for (let position = 1; position <= 20; position++) {
      expect(CARD_ACCENTS).toContain(accentForPosition(position));
    }
  });
});

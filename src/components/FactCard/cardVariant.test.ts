import { describe, it, expect } from 'vitest';
import { getCardVariant } from './cardVariant';
import { accentForPosition } from '../../lib/cardAccent';

describe('getCardVariant', () => {
  it('returns the accent and size for the first position', () => {
    expect(getCardVariant(1)).toEqual({ accent: 'pink', size: 'third' });
  });

  it('walks the 7-card size rhythm in order', () => {
    const sizes = [1, 2, 3, 4, 5, 6, 7].map((p) => getCardVariant(p).size);
    expect(sizes).toEqual(['third', 'third', 'third', 'half', 'half', 'two-thirds', 'third']);
  });

  it('wraps the size cycle every 7 cards', () => {
    expect(getCardVariant(8).size).toBe('third');
    expect(getCardVariant(14).size).toBe(getCardVariant(7).size);
  });

  it('keeps the accent in lockstep with accentForPosition', () => {
    for (let position = 1; position <= 15; position++) {
      expect(getCardVariant(position).accent).toBe(accentForPosition(position));
    }
  });

  it('clamps non-positive positions to the first variant', () => {
    expect(getCardVariant(0)).toEqual({ accent: 'pink', size: 'third' });
  });
});

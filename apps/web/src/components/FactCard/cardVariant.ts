import { accentForPosition, type CardAccent } from '@/lib/cardAccent';

// 7-card rhythm that tiles a 6-column grid cleanly:
//   row 1: third + third + third           (2+2+2 = 6)
//   row 2: half  + half                    (3+3   = 6)
//   row 3: two-thirds + third              (4+2   = 6)
// Cycle repeats every 7 cards. Keyed on position, not content.
const SIZE_CYCLE = ['third', 'third', 'third', 'half', 'half', 'two-thirds', 'third'] as const;

export type CardSize = (typeof SIZE_CYCLE)[number];

export function getCardVariant(position: number): { accent: CardAccent; size: CardSize } {
  return {
    accent: accentForPosition(position),
    size: SIZE_CYCLE[Math.max(0, position - 1) % SIZE_CYCLE.length],
  };
}

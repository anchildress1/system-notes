export const CARD_ACCENTS = ['pink', 'violet', 'teal', 'gold'] as const;

export type CardAccent = (typeof CARD_ACCENTS)[number];

export function accentForPosition(position: number): CardAccent {
  return CARD_ACCENTS[Math.max(0, position - 1) % CARD_ACCENTS.length];
}

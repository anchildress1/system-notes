// Accent hues cycled across the card grids so both Choices (FactCard) and
// Builds (ProjectCard) draw from the same rotation — keyed on position, not
// content, so it's deterministic (SSR-safe) and stays varied down the grid.
export const CARD_ACCENTS = ['pink', 'violet', 'teal', 'gold'] as const;

export type CardAccent = (typeof CARD_ACCENTS)[number];

/** Accent for a 1-indexed grid position. */
export function accentForPosition(position: number): CardAccent {
  return CARD_ACCENTS[Math.max(0, position - 1) % CARD_ACCENTS.length];
}

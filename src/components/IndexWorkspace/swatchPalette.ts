/* Tones a category's tiles and its filter swatch, indexed by the category's rank
   by size. The largest category takes slot 0.

   Every entry is a token and never a literal: a literal cannot follow a theme.
   This module ranks; globals.css paints. */
export const SWATCH_PALETTE = [
  'var(--k-decision)',
  'var(--k-note)',
  'var(--k-other)',
  'var(--k-principle)',
] as const;

/* Reserved for the awards category and deliberately outside the rank palette —
   while it was slot 0, whichever category ranked first painted identically.

   It resolves to the same pigment as the accent slot without colliding with it,
   because an award is not FILLED: it is a hollow ring, told apart by shape. */
export const AWARD_SWATCH = 'var(--k-award)';

/* Assigns every category its swatch, by rank among the categories that draw from
   the rank palette.

   An award category takes {@link AWARD_SWATCH} and must NOT consume a rank slot.
   While it did, five categories over a four-slot palette wrapped the last back
   onto slot 0 and two categories painted the same colour.

   @param values Category values in rank order, largest first.
   @param isAward Names the categories that take the reserved award tone.
   @returns Category value to swatch string, one entry per input value. */
export function assignSwatches(
  values: readonly string[],
  isAward: (value: string) => boolean
): Map<string, string> {
  let rank = 0;
  const assigned = new Map<string, string>();
  for (const value of values) {
    if (assigned.has(value)) continue;
    assigned.set(
      value,
      isAward(value) ? AWARD_SWATCH : SWATCH_PALETTE[rank++ % SWATCH_PALETTE.length]!
    );
  }
  return assigned;
}

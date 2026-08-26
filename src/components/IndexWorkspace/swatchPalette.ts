/**
 * Tones a category's tiles and its filter swatch, indexed by the category's rank
 * by size. The largest category takes slot 0, the next slot 1, and so on.
 *
 * Every entry is a token and never a literal. A literal cannot follow a theme,
 * so a color written here would paint identically against both boards — and the
 * light board is where that is fatal. What the tones actually are, and why they
 * are three neutrals and a gold rather than an arc of hues, is decided in
 * globals.css beside the tokens themselves. This module ranks; it does not paint.
 */
export const SWATCH_PALETTE = [
  'var(--k-decision)',
  'var(--k-note)',
  'var(--k-other)',
  'var(--k-principle)',
] as const;

/**
 * Reserved for the awards category and deliberately outside the rank palette.
 * While it was slot 0, whichever category happened to rank first took the same
 * tone as the awards, and two rows of the filing list painted identically.
 *
 * It resolves to the same pigment as the accent slot and does not collide with
 * it, because an award is not FILLED — it is a hollow ring, told apart by shape
 * rather than by tone. The ring is drawn in IndexWorkspace.module.css.
 */
export const AWARD_SWATCH = 'var(--k-award)';

/**
 * Assigns every category its swatch, by rank among the categories that actually
 * draw from the rank palette.
 *
 * An award category takes {@link AWARD_SWATCH} and must NOT consume a rank slot.
 * While it did, five categories over a four-slot palette wrapped the last one
 * back onto slot 0: Principles and Decisions painted the same color on both
 * boards, which is indistinguishable from a filter that does nothing.
 *
 * @param values Category values in rank order, largest first.
 * @param isAward Names the categories that take the reserved award tone.
 * @returns Category value to swatch string, one entry per input value.
 */
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

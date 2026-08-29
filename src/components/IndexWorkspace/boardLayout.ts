/**
 * Tallest the board is allowed to stand, in tile rows.
 *
 * A height cap rather than a fraction of the index's own height. The board used
 * to keep two thirds of however many rows the current set happened to need,
 * which made its height a function of the filter: the same sidebar was nine
 * rows tall unfiltered and one row tall under a narrow facet. Nine rows is what
 * the old scale resolved to on a full index at a typical width, held steady.
 */
export const BOARD_MAX_ROWS = 9;

/**
 * Trims a ranked list to the tiles the board has room to stand.
 *
 * Everything fits until the board runs out of HEIGHT. Nothing is dropped for
 * the sake of squaring off the last row, which is the bug this replaces: with
 * 27 notes over 19 columns the board counted one whole row, scaled it, and
 * rendered 19 — throwing away 8 tiles it had obvious room for and captioning it
 * "19 of 27". A board that hides a third of a filtered set to keep a clean edge
 * has its priorities backwards; the ragged last row is the honest shape of the
 * data.
 *
 * When the cap does bite, the cut lands on a row boundary by construction —
 * capacity is a whole number of rows — so the large case stays a rectangle.
 *
 * Order is preserved and tiles are dropped from the tail, so the result is
 * always a prefix of the input.
 *
 * @param items Ranked notes, highest first.
 * @param columns Resolved column count, or 0 when it could not be measured.
 * @param maxRows Tallest the board may stand.
 * @returns The input when it fits; otherwise a prefix filling exactly maxRows.
 *   Never pads — every tile is a real note.
 */
export function fitBoardToWholeRows<T>(
  items: readonly T[],
  columns: number,
  maxRows: number = BOARD_MAX_ROWS
): readonly T[] {
  // Unmeasured. A hidden board must not be re-fitted against a count that was
  // never resolved.
  if (columns < 1) return items;

  const capacity = columns * maxRows;
  return items.length <= capacity ? items : items.slice(0, capacity);
}

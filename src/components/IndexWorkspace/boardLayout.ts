/* Tallest the board is allowed to stand, in tile rows.

   A height cap rather than a fraction of the index's own height, which made the
   board's height a function of the filter: nine rows unfiltered, one row under a
   narrow facet. */
export const BOARD_MAX_ROWS = 9;

/* Trims a ranked list to the tiles the board has room to stand.

   Everything fits until the board runs out of HEIGHT. Nothing is dropped to square
   off the last row — the ragged last row is the honest shape of the data. When the
   cap does bite the cut lands on a row boundary by construction, since capacity is
   a whole number of rows.

   @param items Ranked notes, highest first.
   @param columns Resolved column count, or 0 when it could not be measured.
   @param maxRows Tallest the board may stand.
   @returns The input when it fits; otherwise a prefix filling exactly maxRows.
     Never pads — every tile is a real note. */
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

/**
 * How much of the board's natural height to fill. The board reads as a dense
 * block of ranked signal rather than a manifest, and at full height it ran long
 * enough to push the rest of the sidebar down the page.
 */
export const BOARD_ROW_SCALE = 2 / 3;

/**
 * Trims a ranked list to the tiles the board should render.
 *
 * The board's grid auto-fills columns from the sidebar's width, so a fixed tile
 * count leaves a ragged part-row at most widths. Returning whole rows keeps it a
 * rectangle at every size. Order is preserved and tiles are dropped from the
 * tail, so the result is always a prefix of the input.
 *
 * @param items Ranked notes, highest first.
 * @param columns Resolved column count, or 0 when it could not be measured.
 * @param rowScale Fraction of the natural row count to keep.
 * @returns The input when it cannot or should not be trimmed; otherwise a prefix
 *   filling whole rows. Never pads — every tile is a real note.
 */
export function fitBoardToWholeRows<T>(
  items: readonly T[],
  columns: number,
  rowScale: number = BOARD_ROW_SCALE
): readonly T[] {
  // Unmeasured, or not even one full row to square off.
  if (columns < 1 || items.length < columns) return items;

  const wholeRows = Math.floor(items.length / columns);
  const rows = Math.max(1, Math.round(wholeRows * rowScale));
  return items.slice(0, rows * columns);
}

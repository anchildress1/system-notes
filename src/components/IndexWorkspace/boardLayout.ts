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

/**
 * Extends a trimmed board far enough down the census to reach every match.
 *
 * The trim exists to keep the resting board short, and the notes it drops stay
 * reachable through search and the queue. Under a refinement that stops being
 * true: a match the board never renders is a note with no route to it at all.
 * Filtering to System Notes rendered 40 tiles against 65 matches, so 25 cards
 * were not dimmed but absent.
 *
 * The extension is whole rows and always a prefix, so the board keeps its shape
 * and its order — it grows downward rather than rearranging.
 *
 * @param census Ranked notes the board draws from, highest first.
 * @param trimmedLength Tile count the resting board would show.
 * @param columns Resolved column count, or 0 when it could not be measured.
 * @param isMatch Whether a note matches the current refinement.
 * @returns A prefix of the census holding every match, never shorter than the
 *   trimmed board and never longer than the census itself.
 */
export function extendBoardToMatches<T>(
  census: readonly T[],
  trimmedLength: number,
  columns: number,
  isMatch: (item: T) => boolean
): readonly T[] {
  let lastMatch = -1;
  for (let index = census.length - 1; index >= 0; index -= 1) {
    if (isMatch(census[index]!)) {
      lastMatch = index;
      break;
    }
  }
  // Nothing matches, or the trim already reaches the furthest one.
  if (lastMatch < trimmedLength) return census.slice(0, trimmedLength);

  // Round up to a whole row so the board stays rectangular where it can; the
  // census may simply run out first, and a short final row beats a lost note.
  const needed = columns > 0 ? Math.ceil((lastMatch + 1) / columns) * columns : lastMatch + 1;
  return census.slice(0, Math.min(census.length, Math.max(trimmedLength, needed)));
}

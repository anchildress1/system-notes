import { describe, expect, it } from 'vitest';
import { BOARD_ROW_SCALE, extendBoardToMatches, fitBoardToWholeRows } from './boardLayout';

const notes = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe('fitBoardToWholeRows', () => {
  it('fills whole rows so the board is a rectangle', () => {
    // 347 notes, 21 columns: 16 natural rows, scaled to 11.
    const fitted = fitBoardToWholeRows(notes(347), 21);

    expect(fitted).toHaveLength(11 * 21);
    expect(fitted.length % 21).toBe(0);
  });

  it('re-fits when the column count changes', () => {
    const items = notes(347);

    // Same notes, narrower board: fewer columns, more rows, still whole.
    expect(fitBoardToWholeRows(items, 16).length % 16).toBe(0);
    expect(fitBoardToWholeRows(items, 20).length % 20).toBe(0);
    expect(fitBoardToWholeRows(items, 21).length % 21).toBe(0);
  });

  it('keeps rank order and trims from the tail', () => {
    const fitted = fitBoardToWholeRows(notes(100), 10);

    expect(fitted).toEqual(notes(fitted.length));
    expect(fitted.at(-1)).toBe(fitted.length);
  });

  it('returns everything when the column count could not be measured', () => {
    const items = notes(347);

    // 0 is the "unmeasured" signal — a hidden board must not be re-fitted
    // against a column count that was never resolved.
    expect(fitBoardToWholeRows(items, 0)).toBe(items);
    expect(fitBoardToWholeRows(items, -1)).toBe(items);
  });

  it('returns everything when there is not one full row to square off', () => {
    const items = notes(6);

    expect(fitBoardToWholeRows(items, 21)).toBe(items);
  });

  it('keeps a single row rather than emptying the board', () => {
    // 21 notes over 20 columns: one natural row, and 2/3 of that must not be 0.
    const fitted = fitBoardToWholeRows(notes(21), 20);

    expect(fitted).toHaveLength(20);
  });

  it('handles an exact multiple without dropping a whole row to rounding', () => {
    // 60 notes, 10 columns: 6 natural rows, scaled to 4.
    expect(fitBoardToWholeRows(notes(60), 10)).toHaveLength(40);
  });

  it('never pads beyond the notes it was given', () => {
    for (const count of [1, 7, 21, 99, 347]) {
      for (const columns of [0, 1, 5, 16, 21, 400]) {
        const fitted = fitBoardToWholeRows(notes(count), columns);
        expect(fitted.length).toBeLessThanOrEqual(count);
        expect(fitted).toEqual(notes(fitted.length));
      }
    }
  });

  it('honours an explicit row scale', () => {
    expect(fitBoardToWholeRows(notes(100), 10, 1)).toHaveLength(100);
    expect(fitBoardToWholeRows(notes(100), 10, 0.5)).toHaveLength(50);
    expect(BOARD_ROW_SCALE).toBeCloseTo(2 / 3);
  });

  it('tolerates an empty index', () => {
    expect(fitBoardToWholeRows([], 21)).toEqual([]);
  });
});

describe('extendBoardToMatches', () => {
  const notes = (count: number) => Array.from({ length: count }, (_, index) => index + 1);
  const matching =
    (...ids: number[]) =>
    (item: number) =>
      ids.includes(item);

  it('leaves the board alone when every match already fits', () => {
    // Matches at 3 and 12 are inside a 40-tile board; nothing needs to grow.
    expect(extendBoardToMatches(notes(65), 40, 20, matching(3, 12))).toHaveLength(40);
  });

  it('grows to reach a match past the trim', () => {
    // Filtering to System Notes: 65 matches against a 40-tile board dropped 25.
    const fitted = extendBoardToMatches(notes(65), 40, 20, matching(65));
    expect(fitted).toHaveLength(65);
    expect(fitted.at(-1)).toBe(65);
  });

  it('grows in whole rows so the board keeps its shape', () => {
    // Last match at 41 needs 3 rows of 20, not 41 loose tiles.
    expect(extendBoardToMatches(notes(200), 40, 20, matching(41))).toHaveLength(60);
  });

  it('stops at the end of the census rather than inventing tiles', () => {
    // 65 items cannot fill the 80 that whole rows would ask for.
    expect(extendBoardToMatches(notes(65), 40, 20, matching(65))).toHaveLength(65);
  });

  it('keeps rank order and stays a prefix', () => {
    const fitted = extendBoardToMatches(notes(100), 20, 10, matching(73));
    expect(fitted).toEqual(notes(fitted.length));
  });

  it('holds the trimmed board when nothing matches at all', () => {
    expect(extendBoardToMatches(notes(65), 40, 20, () => false)).toHaveLength(40);
  });

  it('reaches the furthest match, not the first one it finds', () => {
    expect(extendBoardToMatches(notes(200), 40, 20, matching(5, 99))).toHaveLength(100);
  });

  it('falls back to an exact cut when the column count is unmeasured', () => {
    expect(extendBoardToMatches(notes(200), 40, 0, matching(57))).toHaveLength(57);
  });

  it('tolerates an empty census', () => {
    expect(extendBoardToMatches([], 40, 20, () => true)).toEqual([]);
  });

  it('never returns fewer tiles than the trimmed board', () => {
    for (const trimmed of [0, 5, 40, 120]) {
      const fitted = extendBoardToMatches(notes(100), trimmed, 20, matching(2));
      expect(fitted.length).toBeGreaterThanOrEqual(Math.min(trimmed, 100));
    }
  });
});

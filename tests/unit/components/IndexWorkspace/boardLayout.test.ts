import { describe, expect, it } from 'vitest';
import { BOARD_MAX_ROWS, fitBoardToWholeRows } from '@/components/IndexWorkspace/boardLayout';

const notes = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe('fitBoardToWholeRows', () => {
  it('shows every note that fits, even when the last row is ragged', () => {
    // The reported bug: 27 awards over 19 columns rendered 19 and captioned it
    // "19 of 27". One whole row plus a part row is two rows, and the board has
    // room for nine.
    expect(fitBoardToWholeRows(notes(27), 19)).toHaveLength(27);
  });

  it('fills whole rows when the height cap actually bites', () => {
    // 347 notes over 21 columns needs 17 rows; the board stands 9.
    const fitted = fitBoardToWholeRows(notes(347), 21);

    expect(fitted).toHaveLength(BOARD_MAX_ROWS * 21);
    expect(fitted.length % 21).toBe(0);
  });

  it('re-fits when the column count changes', () => {
    const items = notes(347);

    for (const columns of [16, 20, 21]) {
      expect(fitBoardToWholeRows(items, columns).length % columns).toBe(0);
    }
  });

  it('keeps its height steady as a filter narrows the set', () => {
    // The old scale made height a function of the filter: two thirds of however
    // many rows the current set needed. A cap is the same board every time.
    const wide = fitBoardToWholeRows(notes(347), 19).length / 19;
    const narrow = fitBoardToWholeRows(notes(200), 19).length / 19;

    expect(wide).toBe(BOARD_MAX_ROWS);
    expect(narrow).toBe(BOARD_MAX_ROWS);
  });

  it('keeps rank order and trims from the tail', () => {
    const fitted = fitBoardToWholeRows(notes(400), 10);

    expect(fitted).toEqual(notes(fitted.length));
    expect(fitted.at(-1)).toBe(fitted.length);
  });

  it('returns everything when the column count could not be measured', () => {
    const items = notes(347);

    expect(fitBoardToWholeRows(items, 0)).toBe(items);
    expect(fitBoardToWholeRows(items, -1)).toBe(items);
  });

  it('returns everything when there is not even one full row', () => {
    const items = notes(6);

    expect(fitBoardToWholeRows(items, 21)).toBe(items);
  });

  it('keeps a single short row rather than emptying the board', () => {
    expect(fitBoardToWholeRows(notes(21), 20)).toHaveLength(21);
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

  it('honours an explicit row cap', () => {
    expect(fitBoardToWholeRows(notes(100), 10, 10)).toHaveLength(100);
    expect(fitBoardToWholeRows(notes(100), 10, 5)).toHaveLength(50);
    expect(BOARD_MAX_ROWS).toBe(9);
  });

  it('tolerates an empty index', () => {
    expect(fitBoardToWholeRows([], 21)).toEqual([]);
  });
});

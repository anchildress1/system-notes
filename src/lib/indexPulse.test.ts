import { describe, expect, it } from 'vitest';
import { latestTimestamp } from './indexPulse';

describe('latestTimestamp', () => {
  it('picks the newest of several timestamps regardless of order', () => {
    expect(
      latestTimestamp([
        { created_at: '2026-01-02T00:00:00Z' },
        { created_at: '2026-08-19T00:00:00Z' },
        { created_at: '2026-04-01T00:00:00Z' },
      ])
    ).toBe('2026-08-19T00:00:00Z');
  });

  it('returns the single timestamp when there is only one', () => {
    expect(latestTimestamp([{ created_at: '2026-08-19T00:00:00Z' }])).toBe('2026-08-19T00:00:00Z');
  });

  it('skips records that carry no usable date', () => {
    // A malformed record is data to step over, not a reason to report nothing.
    expect(
      latestTimestamp([
        { created_at: 'not a date' },
        {},
        { created_at: 42 },
        { created_at: null },
        { created_at: '2026-03-03T00:00:00Z' },
      ])
    ).toBe('2026-03-03T00:00:00Z');
  });

  it('returns null when nothing in the set is usable', () => {
    expect(latestTimestamp([])).toBeNull();
    expect(latestTimestamp([{}, { created_at: 'rubbish' }, { created_at: 7 }])).toBeNull();
  });

  it('keeps the exact string it was given rather than a reformatted one', () => {
    // The value is handed to the client verbatim, so it must survive intact.
    const offset = '2026-08-19T12:00:00+02:00';
    expect(latestTimestamp([{ created_at: offset }])).toBe(offset);
  });

  it('holds the first of two identical timestamps rather than churning', () => {
    const same = '2026-08-19T00:00:00Z';
    expect(latestTimestamp([{ created_at: same }, { created_at: same }])).toBe(same);
  });
});

import { describe, expect, it } from 'vitest';
import { relativeAge } from './relativeAge';

const NOW = Date.parse('2026-08-20T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('relativeAge', () => {
  it('collapses anything under a minute to just now', () => {
    expect(relativeAge(ago(0), NOW)).toBe('just now');
    expect(relativeAge(ago(59_000), NOW)).toBe('just now');
  });

  it('counts whole minutes, then whole hours, then whole days', () => {
    expect(relativeAge(ago(60_000), NOW)).toBe('1m ago');
    expect(relativeAge(ago(59 * 60_000), NOW)).toBe('59m ago');
    expect(relativeAge(ago(60 * 60_000), NOW)).toBe('1h ago');
    expect(relativeAge(ago(23 * 3_600_000), NOW)).toBe('23h ago');
    expect(relativeAge(ago(24 * 3_600_000), NOW)).toBe('1d ago');
    expect(relativeAge(ago(400 * 86_400_000), NOW)).toBe('400d ago');
  });

  it('floors rather than rounds, so nothing ages early', () => {
    // 119 minutes is still the first hour finished, not the second.
    expect(relativeAge(ago(119 * 60_000), NOW)).toBe('1h ago');
  });

  it('says nothing for a timestamp in the future', () => {
    // A clock disagreement is not an age; "-3h ago" would be worse than silence.
    expect(relativeAge(new Date(NOW + 3_600_000).toISOString(), NOW)).toBeNull();
  });

  it('says nothing when there is no usable timestamp', () => {
    expect(relativeAge(null, NOW)).toBeNull();
    expect(relativeAge(undefined, NOW)).toBeNull();
    expect(relativeAge('', NOW)).toBeNull();
    expect(relativeAge('not a date', NOW)).toBeNull();
  });
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Describes how long ago something happened, in the header's clipped register.
 *
 * Deliberately coarse: the header states when the index last moved, not a
 * duration anyone will do arithmetic on.
 *
 * @param iso ISO timestamp of the event.
 * @param now Milliseconds to measure from; defaults to the current time.
 * @returns A phrase such as `just now`, `2h ago`, `3d ago`, or null when the
 *   timestamp is unusable or lies in the future.
 */
export function relativeAge(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const elapsed = now - then;
  // A future timestamp means a clock disagreement, not an age. Say nothing
  // rather than "-3h ago".
  if (elapsed < 0) return null;
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  return `${Math.floor(elapsed / DAY)}d ago`;
}

import { describe, expect, it } from 'vitest';
import { failureCause } from '@/lib/failureCause';

describe('failureCause', () => {
  it('names the error and what it said', () => {
    expect(failureCause(new Error('Unreachable hosts'))).toBe('Error: Unreachable hosts');
  });

  it('keeps a provider error class apart from a deadline', () => {
    const retry = new Error('Unreachable hosts');
    retry.name = 'RetryError';

    // Telling an outage from a timeout is the whole point of logging the cause.
    expect(failureCause(retry)).toBe('RetryError: Unreachable hosts');
  });

  it('falls back to the name alone when there is no message', () => {
    expect(failureCause(new Error(''))).toBe('Error');
  });

  it('labels a thrown non-error rather than rendering it', () => {
    expect(failureCause('socket hang up')).toBe('ProviderError');
    expect(failureCause(undefined)).toBe('ProviderError');
  });
});

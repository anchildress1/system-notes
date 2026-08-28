import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  search: vi.fn(),
  hasCredentials: true,
}));

vi.mock('algoliasearch', () => ({
  algoliasearch: () => ({ searchSingleIndex: harness.search }),
}));

vi.mock('@/lib/algolia', () => ({
  hasValidAlgoliaCredentials: () => harness.hasCredentials,
  ALGOLIA_APP_ID: 'TESTAPPID1',
  ALGOLIA_SEARCH_KEY: 'test_search_key_valid_length_20',
}));

/** Fresh module per test: the pulse holds its cache and client in module scope. */
async function loadPulse() {
  vi.resetModules();
  return import('@/lib/indexPulse');
}

describe('getIndexPulse', () => {
  beforeEach(() => {
    harness.hasCredentials = true;
    harness.search.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports the total and the newest filing date', async () => {
    harness.search.mockResolvedValue({
      nbHits: 279,
      hits: [{ created_at: '2026-01-01T00:00:00Z' }, { created_at: '2026-08-17T09:00:00Z' }],
    });
    const { getIndexPulse } = await loadPulse();

    expect(await getIndexPulse()).toEqual({
      total: 279,
      latestCreatedAt: '2026-08-17T09:00:00Z',
    });
  });

  it('asks the index for nothing but the dates', async () => {
    harness.search.mockResolvedValue({ nbHits: 1, hits: [] });
    const { getIndexPulse } = await loadPulse();
    await getIndexPulse();

    // Pulling whole records to count them would move megabytes per cold render.
    expect(harness.search).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: expect.objectContaining({ attributesToRetrieve: ['created_at'] }),
      })
    );
  });

  it('serves a second caller from cache without asking again', async () => {
    harness.search.mockResolvedValue({ nbHits: 12, hits: [] });
    const { getIndexPulse } = await loadPulse();

    const first = await getIndexPulse();
    const second = await getIndexPulse();

    expect(second).toEqual(first);
    expect(harness.search).toHaveBeenCalledOnce();
  });

  it('asks again once the cache has aged out', async () => {
    harness.search.mockResolvedValue({ nbHits: 12, hits: [] });
    const { getIndexPulse, PULSE_TTL_MS } = await loadPulse();
    const start = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);

    await getIndexPulse();
    clock.mockReturnValue(start + PULSE_TTL_MS + 1);
    await getIndexPulse();

    expect(harness.search).toHaveBeenCalledTimes(2);
  });

  it('counts the hits it got when the index reports no total', async () => {
    harness.search.mockResolvedValue({
      hits: [{ created_at: '2026-08-01T00:00:00Z' }, {}],
    });
    const { getIndexPulse } = await loadPulse();

    expect(await getIndexPulse()).toEqual({ total: 2, latestCreatedAt: '2026-08-01T00:00:00Z' });
  });

  it('reports nothing rather than a zero when the index refuses', async () => {
    harness.search.mockRejectedValue(new Error('RetryError'));
    const { getIndexPulse } = await loadPulse();

    // A null pulse renders the unnumbered header; a zero would be a lie.
    expect(await getIndexPulse()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Index pulse lookup failed.',
      expect.objectContaining({ name: 'Error' })
    );
  });

  it('caches an unavailable pulse to avoid repeating the request timeout', async () => {
    harness.search.mockRejectedValue(new Error('RetryError'));
    const { getIndexPulse } = await loadPulse();

    expect(await getIndexPulse()).toBeNull();
    expect(await getIndexPulse()).toBeNull();

    expect(harness.search).toHaveBeenCalledOnce();
  });

  it('retries an unavailable pulse after its cache expires', async () => {
    const start = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    harness.search
      .mockRejectedValueOnce(new Error('RetryError'))
      .mockResolvedValueOnce({ nbHits: 1, hits: [{ created_at: '2026-08-17T09:00:00Z' }] });
    const { getIndexPulse, PULSE_TTL_MS } = await loadPulse();

    expect(await getIndexPulse()).toBeNull();
    clock.mockReturnValue(start + PULSE_TTL_MS + 1);

    expect(await getIndexPulse()).toEqual({ total: 1, latestCreatedAt: '2026-08-17T09:00:00Z' });
    expect(harness.search).toHaveBeenCalledTimes(2);
  });

  it('gives up rather than holding a page open indefinitely', async () => {
    vi.useFakeTimers();
    harness.search.mockReturnValue(new Promise(() => {}));
    const { getIndexPulse } = await loadPulse();

    const pending = getIndexPulse();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(await pending).toBeNull();
  });

  it('never calls the index without credentials', async () => {
    harness.hasCredentials = false;
    const { getIndexPulse } = await loadPulse();

    expect(await getIndexPulse()).toBeNull();
    expect(harness.search).not.toHaveBeenCalled();
  });

  it('does not contact the provider when the test boundary disables the pulse', async () => {
    vi.stubEnv('INDEX_PULSE_DISABLED', 'true');
    const { getIndexPulse } = await loadPulse();

    expect(await getIndexPulse()).toBeNull();
    expect(harness.search).not.toHaveBeenCalled();
  });
});

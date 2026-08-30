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

const hit = (over: Record<string, unknown> = {}) => ({
  objectID: 'note-1',
  title: 'A filed decision',
  fact: 'The body a crawler reads.',
  category: 'Decisions',
  projects: ['System Notes'],
  created_at: '2026-08-01T00:00:00.000Z',
  ...over,
});

/** Fresh module per test: the fetch holds its cache and client in module scope. */
async function loadNotes() {
  vi.resetModules();
  return import('@/lib/indexNotes');
}

describe('getIndexNotes', () => {
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

  it('returns the notes the manifest renders', async () => {
    harness.search.mockResolvedValue({ hits: [hit()] });
    const { getIndexNotes } = await loadNotes();

    await expect(getIndexNotes()).resolves.toEqual([
      {
        id: 'note-1',
        title: 'A filed decision',
        body: 'The body a crawler reads.',
        category: 'Decisions',
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ]);
  });

  it('asks for a bounded page and only the fields the manifest shows', async () => {
    harness.search.mockResolvedValue({ hits: [] });
    const { getIndexNotes, SSR_NOTE_LIMIT } = await loadNotes();
    await getIndexNotes();

    // An unbounded fetch would put the whole corpus in the HTML of a route that
    // gates at a mobile Lighthouse floor.
    const [{ searchParams }] = harness.search.mock.calls[0];
    expect(searchParams.hitsPerPage).toBe(SSR_NOTE_LIMIT);
    expect(searchParams.attributesToRetrieve).not.toContain('tags.lvl0');
  });

  it('serves the cached page rather than asking the index per request', async () => {
    harness.search.mockResolvedValue({ hits: [hit()] });
    const { getIndexNotes } = await loadNotes();

    await getIndexNotes();
    await getIndexNotes();

    expect(harness.search).toHaveBeenCalledTimes(1);
  });

  it('renders the route without notes rather than failing on an index outage', async () => {
    harness.search.mockRejectedValue(new Error('index unreachable'));
    const { getIndexNotes } = await loadNotes();

    await expect(getIndexNotes()).resolves.toEqual([]);
  });

  it('does not make every request wait through the same outage', async () => {
    harness.search.mockRejectedValue(new Error('index unreachable'));
    const { getIndexNotes } = await loadNotes();

    await getIndexNotes();
    await getIndexNotes();

    expect(harness.search).toHaveBeenCalledTimes(1);
  });

  it('asks the index for nothing when there are no usable credentials', async () => {
    harness.hasCredentials = false;
    const { getIndexNotes } = await loadNotes();

    await expect(getIndexNotes()).resolves.toEqual([]);
    expect(harness.search).not.toHaveBeenCalled();
  });

  it('stays off the index when the pulse is switched off for a test run', async () => {
    vi.stubEnv('INDEX_PULSE_DISABLED', 'true');
    const { getIndexNotes } = await loadNotes();

    await expect(getIndexNotes()).resolves.toEqual([]);
    expect(harness.search).not.toHaveBeenCalled();
  });

  it('gives up on an index that never answers', async () => {
    vi.useFakeTimers();
    harness.search.mockReturnValue(new Promise(() => {}));
    const { getIndexNotes } = await loadNotes();

    const pending = getIndexNotes();
    await vi.advanceTimersByTimeAsync(4_000);

    await expect(pending).resolves.toEqual([]);
  });
});

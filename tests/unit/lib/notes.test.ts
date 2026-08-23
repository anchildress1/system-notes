import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const algoliaHarness = vi.hoisted(() => ({
  getObject: vi.fn(),
  clientFactory: vi.fn(),
}));

vi.mock('algoliasearch', () => ({
  algoliasearch: (...args: unknown[]) => {
    algoliaHarness.clientFactory(...args);
    return { getObject: algoliaHarness.getObject };
  },
}));

async function importConfiguredNotes() {
  vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'TESTAPPID1');
  vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test_search_key_valid_length_20');
  vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME', 'system-notes');
  return import('@/lib/notes');
}

describe('note retrieval', () => {
  beforeEach(() => {
    vi.resetModules();
    algoliaHarness.getObject.mockReset();
    algoliaHarness.clientFactory.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('parses a complete remote note into the public shape', async () => {
    const { parseNoteRecord } = await importConfiguredNotes();
    const record = {
      objectID: 'card:test:1',
      title: 'Failure is data',
      blurb: 'Short',
      fact: 'Fact',
      content: 'Long',
      'tags.lvl0': ['Testing'],
      'tags.lvl1': ['Testing > Failure'],
      projects: ['System Notes'],
      category: 'Principle',
      url: 'https://example.com',
      created_at: '2026-08-01',
    };

    expect(parseNoteRecord(record, record.objectID)).toEqual(record);
  });

  it.each([
    [null, 'card:test:1'],
    [{ objectID: 'wrong', title: 'Title' }, 'card:test:1'],
    [{ objectID: 'card:test:1' }, 'card:test:1'],
  ])('rejects malformed record %j', async (record, expectedId) => {
    const { parseNoteRecord } = await importConfiguredNotes();

    expect(parseNoteRecord(record, expectedId)).toBeNull();
  });

  it('normalizes optional remote fields and wrong collection types', async () => {
    const { parseNoteRecord } = await importConfiguredNotes();

    expect(
      parseNoteRecord(
        {
          objectID: 'card:test:1',
          title: 'Title',
          projects: 'not-an-array',
          'tags.lvl0': [1, 'Testing', ''],
        },
        'card:test:1'
      )
    ).toMatchObject({
      blurb: '',
      fact: '',
      projects: [],
      category: 'Note',
      'tags.lvl0': ['Testing'],
    });
  });

  it('retrieves a valid note with a bounded attribute list', async () => {
    algoliaHarness.getObject.mockResolvedValue({
      objectID: 'card:test:1',
      title: 'Title',
      projects: [],
    });
    const { getNoteById } = await importConfiguredNotes();

    await expect(getNoteById('card:test:1')).resolves.toMatchObject({
      status: 'found',
      note: { title: 'Title' },
    });
    expect(algoliaHarness.getObject).toHaveBeenCalledWith(
      expect.objectContaining({ indexName: 'system-notes', objectID: 'card:test:1' })
    );
  });

  it('does not call Algolia for an invalid note id', async () => {
    const { getNoteById } = await importConfiguredNotes();

    await expect(getNoteById('@/lib/secret')).resolves.toEqual({ status: 'missing' });
    expect(algoliaHarness.getObject).not.toHaveBeenCalled();
  });

  it('reports missing credentials without throwing into the request path', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', '');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '');
    const { getNoteById } = await import('@/lib/notes');

    await expect(getNoteById('card:test:1')).resolves.toEqual({ status: 'unavailable' });
    expect(algoliaHarness.clientFactory).not.toHaveBeenCalled();
  });

  it('returns null when Algolia reports a missing object', async () => {
    algoliaHarness.getObject.mockRejectedValue({ status: 404 });
    const { getNoteById } = await importConfiguredNotes();

    await expect(getNoteById('card:missing:1')).resolves.toEqual({ status: 'missing' });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('reports remote failures without throwing or leaking provider details', async () => {
    algoliaHarness.getObject.mockRejectedValue(new Error('provider internals'));
    const { getNoteById } = await importConfiguredNotes();

    await expect(getNoteById('card:test:1')).resolves.toEqual({ status: 'unavailable' });
    expect(console.error).toHaveBeenCalledWith('Note lookup failed.', {
      name: 'Error',
      status: undefined,
    });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('provider internals');
  });

  it('bounds a note lookup that never settles', async () => {
    vi.useFakeTimers();
    algoliaHarness.getObject.mockReturnValue(new Promise(() => {}));
    const { getNoteById } = await importConfiguredNotes();

    const lookup = getNoteById('card:test:1');
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(lookup).resolves.toEqual({ status: 'unavailable' });
    expect(console.error).toHaveBeenCalledWith('Note lookup failed.', {
      name: 'Error',
      status: undefined,
    });
  });

  it('reports a malformed provider record as unavailable', async () => {
    algoliaHarness.getObject.mockResolvedValue({ objectID: 'card:test:1', title: 42 });
    const { getNoteById } = await importConfiguredNotes();

    await expect(getNoteById('card:test:1')).resolves.toEqual({ status: 'unavailable' });
    expect(console.error).toHaveBeenCalledWith('Note lookup returned a malformed record.', {
      objectID: 'card:test:1',
    });
  });
});

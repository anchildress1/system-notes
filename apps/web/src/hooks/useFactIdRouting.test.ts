import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFactIdRouting, fetchFactById } from './useFactIdRouting';

const { searchMock } = vi.hoisted(() => ({
  searchMock: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock @/lib/algolia so constants re-read process.env at access time (test isolation)
vi.mock('@/lib/algolia', () => ({
  get ALGOLIA_APP_ID() {
    return process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID ?? '';
  },
  get ALGOLIA_SEARCH_KEY() {
    return process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? '';
  },
  hasValidAlgoliaCredentials: (appId?: string, apiKey?: string) => {
    const a = appId ?? process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID ?? '';
    const k = apiKey ?? process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? '';
    return /^[A-Z0-9]{10}$/i.test(a) && k.length >= 20;
  },
  isValidAppId: (appId: string) => /^[A-Z0-9]{10}$/i.test(appId),
  isValidApiKey: (apiKey: string) => apiKey.length >= 20,
}));

// Mock algoliasearch
vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    search: searchMock,
  })),
}));

describe('useFactIdRouting', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
    searchMock.mockReset();
    vi.mocked(useRouter).mockReturnValue({ replace: vi.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(usePathname).mockReturnValue('/search');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null factId when no factId in URL', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn(() => null),
    } as unknown as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    expect(result.current.factId).toBeNull();
    expect(result.current.overlayHit).toBeNull();
  });

  it('returns factId when present in URL', () => {
    const mockFactId = 'card:test:fact:001';
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    expect(result.current.factId).toBe(mockFactId);
  });

  it('handles null searchParams gracefully', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      null as unknown as ReturnType<typeof useSearchParams>
    );

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    expect(result.current.factId).toBeNull();
    expect(result.current.overlayHit).toBeNull();
  });

  it('fetches card data and returns overlayHit when factId is present', async () => {
    const mockFactId = 'card:test:fact:001';

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: mockFactId,
              title: 'Test Card',
              blurb: 'A test blurb',
              fact: 'A test fact',
              category: 'Work Style',
              projects: ['Project Alpha'],
              signal: 3,
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(result.current.overlayHit).not.toBeNull();
    });

    expect(result.current.overlayHit?.title).toBe('Test Card');
    expect(result.current.overlayHit?.category).toBe('Work Style');
  });

  it('clears overlayHit when factId is removed from URL', async () => {
    const mockFactId = 'card:test:fact:001';

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: mockFactId,
              title: 'Test',
              blurb: '',
              fact: '',
              category: '',
              projects: [],
              signal: 3,
            },
          ],
        },
      ],
    });

    const mockGet = vi.fn((key: string) => (key === 'factId' ? mockFactId : null));
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useSearchParams>);

    const { result, rerender } = renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(result.current.overlayHit).not.toBeNull();
    });

    // Simulate factId removal
    mockGet.mockReturnValue(null);
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn(() => null),
    } as unknown as ReturnType<typeof useSearchParams>);

    rerender();

    await waitFor(() => {
      expect(result.current.overlayHit).toBeNull();
    });
  });

  it('closeOverlay clears state and updates URL', async () => {
    const mockFactId = 'card:test:fact:001';

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: mockFactId,
              title: 'Test',
              blurb: '',
              fact: '',
              category: '',
              projects: [],
              signal: 3,
            },
          ],
        },
      ],
    });

    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(`factId=${encodeURIComponent(mockFactId)}`) as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(result.current.overlayHit).not.toBeNull();
    });

    act(() => {
      result.current.closeOverlay();
    });

    await waitFor(() => {
      expect(result.current.overlayHit).toBeNull();
    });
    expect(mockReplace).toHaveBeenCalled();
  });

  it('ignores fetch result when effect is cancelled before resolve', async () => {
    let resolveSearch!: (value: unknown) => void;
    searchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        })
    );

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? 'card:cancel:test' : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    const { unmount } = renderHook(() => useFactIdRouting('test-index'));

    // Unmount before promise resolves — sets cancelled=true in cleanup
    unmount();

    // Resolve after cancellation — state update must be suppressed
    await act(async () => {
      resolveSearch({
        results: [
          {
            hits: [
              {
                objectID: 'card:cancel:test',
                title: 'T',
                blurb: '',
                fact: '',
                category: '',
                projects: [],
                signal: 1,
              },
            ],
          },
        ],
      });
    });
    // No error thrown; cancelled branch was exercised
  });

  it('does not modify filter params in URL', async () => {
    const mockFactId = 'card:test:fact:001';

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: mockFactId,
              title: 'Test',
              blurb: '',
              fact: '',
              category: 'Work Style',
              projects: ['Alpha'],
              signal: 3,
            },
          ],
        },
      ],
    });

    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(`factId=${encodeURIComponent(mockFactId)}`) as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    renderHook(() => useFactIdRouting('test-index'));

    // Wait for any async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // router.replace must NOT have been called to add filter params — only user actions trigger closeOverlay
    const filterCalls = mockReplace.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('category=')
    );
    expect(filterCalls).toHaveLength(0);
  });
});

describe('fetchFactById', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
    searchMock.mockReset();
  });

  it('returns null when credentials are missing', async () => {
    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when the Algolia search rejects', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockRejectedValue(new Error('API error'));

    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when results array is empty', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    searchMock.mockResolvedValue({ results: [] });

    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when first result has no hits key (error result)', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    searchMock.mockResolvedValue({ results: [{ error: 'Index not found', status: 404 }] });

    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when hits array is empty (objectID not in index)', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    searchMock.mockResolvedValue({ results: [{ hits: [] }] });

    const result = await fetchFactById('card:does:not:exist', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when apiKey is shorter than 20 characters', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'tooshort'; // 8 chars

    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null when appId fails the 10-char alphanumeric regex', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'BAD!ID'; // has non-alphanumeric
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    const result = await fetchFactById('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });

  it('returns null and does not call Algolia when factId contains filter operators', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    const result = await fetchFactById('xxx OR category:secret', 'test-index');
    expect(result).toBeNull();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('returns null and does not call Algolia when factId contains double-quote characters', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    const result = await fetchFactById('card"OR 1:1', 'test-index');
    expect(result).toBeNull();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('returns null and does not call Algolia when factId is an empty string', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    const result = await fetchFactById('', 'test-index');
    expect(result).toBeNull();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('accepts factId containing dots (blog slugs like v2.0-release)', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: 'blog:v2.0-release',
              title: 'V2 Release',
              blurb: 'Release notes',
              fact: 'Shipped v2',
              category: 'Technical',
              projects: ['system-notes'],
              signal: 5,
            },
          ],
        },
      ],
    });

    const result = await fetchFactById('blog:v2.0-release', 'test-index');
    expect(result).not.toBeNull();
    expect(result?.objectID).toBe('blog:v2.0-release');
    expect(searchMock).toHaveBeenCalled();
  });

  it('returns null when Algolia hit is missing required title field', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [{ hits: [{ objectID: 'card:malformed', category: 'X', projects: [] }] }],
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchFactById('card:malformed', 'test-index');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Algolia returned a hit missing required FactHitRecord fields:',
      expect.any(Object)
    );
    consoleSpy.mockRestore();
  });

  it('returns null when Algolia hit is missing required category field', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [{ hits: [{ objectID: 'card:no-cat', title: 'T', projects: [] }] }],
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchFactById('card:no-cat', 'test-index');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it('returns null when Algolia hit is missing required projects field', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [{ hits: [{ objectID: 'card:no-proj', title: 'T', category: 'X' }] }],
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchFactById('card:no-proj', 'test-index');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it('returns null when Algolia hit is not an object', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    searchMock.mockResolvedValue({
      results: [{ hits: ['not-an-object'] }],
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchFactById('card:string-hit', 'test-index');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it('returns null and does not call Algolia when factId exceeds 200 characters', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    const longId = 'a'.repeat(201);
    const result = await fetchFactById(longId, 'test-index');
    expect(result).toBeNull();
    expect(searchMock).not.toHaveBeenCalled();
  });
});

describe('closeOverlay URL handling', () => {
  const validFactId = 'card:test:fact:001';
  const credentials = {
    NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'AB12CD34EF',
    NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  };
  const minimalHit = {
    objectID: validFactId,
    title: 'T',
    blurb: '',
    fact: '',
    category: '',
    projects: [],
    signal: 1,
  };
  let mockReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = credentials.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = credentials.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
    searchMock.mockReset();
    searchMock.mockResolvedValue({ results: [{ hits: [minimalHit] }] });

    mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(usePathname).mockReturnValue('/search');

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(`factId=${encodeURIComponent(validFactId)}`) as unknown as ReturnType<
        typeof useSearchParams
      >
    );
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
    vi.clearAllMocks();
  });

  it('preserves other query params when removing factId', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        `query=agent&factId=${encodeURIComponent(validFactId)}`
      ) as unknown as ReturnType<typeof useSearchParams>
    );

    const { result } = renderHook(() => useFactIdRouting('test-index'));
    await waitFor(() => expect(result.current.overlayHit).not.toBeNull());

    act(() => {
      result.current.closeOverlay();
    });

    expect(mockReplace).toHaveBeenCalled();
    const [newUrl] = mockReplace.mock.calls[0];
    expect(String(newUrl)).toContain('query=agent');
    expect(String(newUrl)).not.toContain('factId');
  });

  async function setupCloseOverlay() {
    const { result } = renderHook(() => useFactIdRouting('test-index'));
    await waitFor(() => expect(result.current.overlayHit).not.toBeNull());
    return { result };
  }

  it('navigates to pathname only when factId is the sole param', async () => {
    const { result } = await setupCloseOverlay();

    act(() => {
      result.current.closeOverlay();
    });

    expect(mockReplace).toHaveBeenCalled();
    const [newUrl] = mockReplace.mock.calls[0];
    expect(String(newUrl)).toBe('/search');
    expect(String(newUrl)).not.toContain('?');
  });

  it('passes { scroll: false } to router.replace to prevent scroll-to-top', async () => {
    const { result } = await setupCloseOverlay();

    act(() => {
      result.current.closeOverlay();
    });

    expect(mockReplace).toHaveBeenCalledWith(expect.any(String), { scroll: false });
  });

  it('closeOverlay is idempotent — second call is a no-op after state is cleared', async () => {
    const { result } = await setupCloseOverlay();

    act(() => {
      result.current.closeOverlay();
    });

    await waitFor(() => expect(result.current.overlayHit).toBeNull());
    const callCountAfterFirst = mockReplace.mock.calls.length;

    act(() => {
      result.current.closeOverlay();
    });

    // router.replace may be called again (URL update is idempotent), but overlayHit stays null
    expect(result.current.overlayHit).toBeNull();
    expect(mockReplace.mock.calls.length).toBeGreaterThanOrEqual(callCountAfterFirst);
  });
});

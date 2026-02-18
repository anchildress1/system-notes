import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFactIdRouting, fetchFactById } from './useFactIdRouting';

const { searchMock } = vi.hoisted(() => ({
  searchMock: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
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

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    window.history.replaceState({}, '', `/search?factId=${encodeURIComponent(mockFactId)}`);
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

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
    expect(pushStateSpy).toHaveBeenCalled();

    pushStateSpy.mockRestore();
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

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    renderHook(() => useFactIdRouting('test-index'));

    // Wait for any async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should NOT have called replaceState to add filter params
    const filterCalls = replaceStateSpy.mock.calls.filter(
      (call) => typeof call[2] === 'string' && call[2].includes('category=')
    );
    expect(filterCalls).toHaveLength(0);

    replaceStateSpy.mockRestore();
  });
});

describe('fetchFactById', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
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
});

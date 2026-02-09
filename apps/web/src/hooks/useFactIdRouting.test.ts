import { renderHook, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFactIdRouting, fetchFactMetadata } from './useFactIdRouting';

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
    // Mock DOM elements
    document.body.innerHTML = '<div aria-label="Search results"></div>';

    // Mock window methods
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0);
      return 0;
    });

    // Clear environment variables
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;

    searchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('returns null factId when no factId in URL', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn(() => null),
    } as unknown as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useFactIdRouting('test-index'));

    expect(result.current.factId).toBeNull();
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
  });

  it('scrolls to card when found in DOM', async () => {
    const mockFactId = 'card:test:fact:001';
    const scrollIntoViewMock = vi.fn();

    // Create a mock card element
    const mockCard = document.createElement('a');
    mockCard.href = `/search?factId=${encodeURIComponent(mockFactId)}`;
    mockCard.scrollIntoView = scrollIntoViewMock;
    const mockArticle = document.createElement('article');
    mockCard.appendChild(mockArticle);
    document.body.appendChild(mockCard);

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });

  it('sets data-highlighted attribute on card article', async () => {
    const mockFactId = 'card:test:fact:002';

    const mockCard = document.createElement('a');
    mockCard.href = `/search?factId=${encodeURIComponent(mockFactId)}`;
    mockCard.scrollIntoView = vi.fn();
    const mockArticle = document.createElement('article');
    mockCard.appendChild(mockArticle);
    document.body.appendChild(mockCard);

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(mockArticle.getAttribute('data-highlighted')).toBe('true');
    });
  });

  it('observes DOM mutations for new cards', async () => {
    const mockFactId = 'card:test:fact:003';

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    const { unmount } = renderHook(() => useFactIdRouting('test-index'));

    // Wait a tick for the hook to initialize
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Add card after hook initialization
    const mockCard = document.createElement('a');
    mockCard.href = `/search?factId=${encodeURIComponent(mockFactId)}`;
    mockCard.scrollIntoView = vi.fn();
    const mockArticle = document.createElement('article');
    mockCard.appendChild(mockArticle);

    const resultsContainer = document.querySelector('[aria-label="Search results"]');
    resultsContainer?.appendChild(mockCard);

    // MutationObserver is async, so we need to wait
    await waitFor(
      () => {
        expect(mockCard.scrollIntoView).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    unmount();
  });

  it('applies metadata filters immediately when URL lacks filters', async () => {
    const mockFactId = 'card:test:fact:004';

    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'AB12CD34EF';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

    window.history.replaceState({}, '', `/search?factId=${encodeURIComponent(mockFactId)}`);

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key) => (key === 'factId' ? mockFactId : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    searchMock.mockResolvedValue({
      results: [
        {
          hits: [
            {
              objectID: mockFactId,
              category: 'Work Style',
              projects: ['Project Alpha'],
              'tags.lvl0': ['Approach'],
              'tags.lvl1': ['Approach > Experimentation'],
            },
          ],
        },
      ],
    });

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    renderHook(() => useFactIdRouting('test-index'));

    await waitFor(() => {
      expect(replaceStateSpy).toHaveBeenCalled();
    });

    const lastUrl = replaceStateSpy.mock.calls.at(-1)?.[2] as string;
    expect(lastUrl).toContain('factId=card%3Atest%3Afact%3A004');
    expect(lastUrl).toContain('category=Work+Style');
    expect(lastUrl).toContain('project=Project+Alpha');
    expect(lastUrl).toContain('tag0=Approach');
    expect(lastUrl).toContain('tag1=Approach+%3E+Experimentation');
  });
});

describe('fetchFactMetadata', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
    delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
  });

  it('returns null when credentials are missing', async () => {
    const result = await fetchFactMetadata('card:test:fact:001', 'test-index');
    expect(result).toBeNull();
  });
});

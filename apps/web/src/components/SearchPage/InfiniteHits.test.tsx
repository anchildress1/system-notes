import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfiniteHits from './InfiniteHits';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';

const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockSendEvent = vi.fn();
const mockShowMore = vi.fn();
const mockShowPrevious = vi.fn();
const mockBindEvent = vi.fn(() => '');

vi.mock('react-instantsearch', () => ({
  useInfiniteHits: vi.fn(() => ({
    items: [
      {
        objectID: 'hit-1',
        title: 'Hit One',
        __position: 1,
        __queryID: 'query-1',
      } as Hit,
    ],
    hits: [
      {
        objectID: 'hit-1',
        title: 'Hit One',
        __position: 1,
        __queryID: 'query-1',
      } as Hit,
    ],
    currentPageHits: [],
    isLastPage: true,
    isFirstPage: true,
    showMore: mockShowMore,
    showPrevious: mockShowPrevious,
    sendEvent: mockSendEvent,
    bindEvent: mockBindEvent,
  })),
  useInstantSearch: vi.fn(() => ({ status: 'idle' })),
}));

// Default hit used in baseHitsState so tests that don't exercise empty state
// get past the isEmpty guard and render the list normally.
const defaultHit: Hit = { objectID: 'hit-default', title: 'Default Hit', __position: 1 };

// Shared base state for mockReturnValue calls — provides the required
// InfiniteHitsRenderState fields that individual tests don't need to vary.
const baseHitsState = {
  items: [defaultHit] as Hit[],
  hits: [defaultHit] as Hit[],
  currentPageHits: [defaultHit] as Hit[],
  isFirstPage: true,
  isLastPage: true,
  showPrevious: mockShowPrevious,
  showMore: mockShowMore,
  sendEvent: mockSendEvent,
  bindEvent: mockBindEvent,
};

// Default no-op IntersectionObserver for tests that don't need custom observer behaviour.
class DefaultIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn();
}

// Shared triggering observer: immediately fires the callback on construction.
// Used by multiple tests to simulate sentinel intersection.
class TriggeringObserver {
  constructor(callback: IntersectionObserverCallback) {
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn();
}

describe('InfiniteHits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // vi.unstubAllGlobals() (called in afterEach) removes the setupTests stub, so we re-apply it here.
    vi.stubGlobal('IntersectionObserver', DefaultIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes sendEvent to hit component', () => {
    const HitComponent = vi.fn(({ hit }) => <div>{hit.title}</div>);

    render(<InfiniteHits hitComponent={HitComponent} />);

    expect(HitComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        sendEvent: mockSendEvent,
      }),
      undefined
    );
  });

  it('triggers showMore when intersection observer detects visibility and has more pages', () => {
    vi.stubGlobal('IntersectionObserver', TriggeringObserver);

    // Must mock useInfiniteHits to return isLastPage: false
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    const HitComponent = () => <div>Hit</div>;
    render(<InfiniteHits hitComponent={HitComponent} />);

    expect(mockShowMore).toHaveBeenCalled();
  });

  it('does not call showMore when isLastPage is true even if sentinel intersects', () => {
    vi.stubGlobal('IntersectionObserver', TriggeringObserver);

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: true,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(mockShowMore).not.toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const disconnect = vi.fn();

    class MockObserver {
      observe = vi.fn();
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockObserver);

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    const { unmount } = render(<InfiniteHits hitComponent={() => <div />} />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows "Show more results" link when not on last page', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toBeInTheDocument();
  });

  it('hides "Show more results" link on last page', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: true,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.queryByText('Show more results')).not.toBeInTheDocument();
  });

  it('nextPageHref defaults to page=2 when no page param is present', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');
  });

  it('nextPageHref increments the current page param', () => {
    mockSearchParams.set('page', '3');

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=4');

    mockSearchParams.delete('page');
  });

  it('nextPageHref falls back to page=2 when page param is zero', () => {
    mockSearchParams.set('page', '0');

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');
    expect(warnSpy).toHaveBeenCalledWith('InfiniteHits: invalid page param, resetting to page 2', {
      page: '0',
    });
    warnSpy.mockRestore();
    mockSearchParams.delete('page');
  });

  it('nextPageHref falls back to page=2 when page param is non-numeric', () => {
    mockSearchParams.set('page', 'abc');

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');
    expect(warnSpy).toHaveBeenCalledWith('InfiniteHits: invalid page param, resetting to page 2', {
      page: 'abc',
    });
    warnSpy.mockRestore();
    mockSearchParams.delete('page');
  });

  it('renders empty state when items array is empty and status is idle', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      items: [],
      hits: [],
      currentPageHits: [],
      isLastPage: true,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('does not render empty state while loading (status !== idle)', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      items: [],
      hits: [],
      currentPageHits: [],
      isLastPage: true,
    });
    vi.mocked(useInstantSearch).mockReturnValue({ status: 'loading' } as never);

    const { container } = render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('renders items when they are present', () => {
    const hit: Hit = {
      objectID: 'hit-42',
      title: 'Answer to everything',
      __position: 1,
    };

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      items: [hit],
      hits: [hit],
      currentPageHits: [hit],
      isLastPage: true,
    });

    render(<InfiniteHits hitComponent={({ hit: h }) => <div>{String(h.title)}</div>} />);
    expect(screen.getByText('Answer to everything')).toBeInTheDocument();
    expect(screen.queryByText('Show more results')).not.toBeInTheDocument();
  });

  it('does not call showMore when sentinel is not intersecting', () => {
    class NonIntersectingObserver {
      constructor(callback: IntersectionObserverCallback) {
        callback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', NonIntersectingObserver);

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(mockShowMore).not.toHaveBeenCalled();
  });

  it('applies custom classNames to root, list, and item', () => {
    const hit: Hit = { objectID: 'h1', __position: 1 };

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      items: [hit],
      hits: [hit],
      currentPageHits: [hit],
      isLastPage: true,
    });

    const { container } = render(
      <InfiniteHits
        hitComponent={() => <div />}
        classNames={{ root: 'my-root', list: 'my-list', item: 'my-item' }}
      />
    );

    expect(container.querySelector('.my-root')).toBeInTheDocument();
    expect(container.querySelector('.my-list')).toBeInTheDocument();
    expect(container.querySelector('.my-item')).toBeInTheDocument();
  });
});

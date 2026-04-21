import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfiniteHits from './InfiniteHits';
import { useInfiniteHits } from 'react-instantsearch';
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
}));

// Shared base state for mockReturnValue calls — provides the required
// InfiniteHitsRenderState fields that individual tests don't need to vary.
const baseHitsState = {
  items: [] as Hit[],
  hits: [] as Hit[],
  currentPageHits: [] as Hit[],
  isFirstPage: true,
  showPrevious: mockShowPrevious,
  bindEvent: mockBindEvent,
};

// Default no-op IntersectionObserver for tests that don't need custom observer behaviour.
// vi.unstubAllGlobals() (called in afterEach) removes the setupTests stub, so we re-apply it.
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
    // Restore default mock after unstubAllGlobals() may have cleared the setupTests version
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    const { unmount } = render(<InfiniteHits hitComponent={() => <div />} />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows "Show more results" link when not on last page', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toBeInTheDocument();
  });

  it('hides "Show more results" link on last page', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: true,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.queryByText('Show more results')).not.toBeInTheDocument();
  });

  it('nextPageHref defaults to page=2 when no page param is present', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');
  });

  it('nextPageHref increments the current page param', () => {
    mockSearchParams.set('page', '3');

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');

    mockSearchParams.delete('page');
  });

  it('nextPageHref falls back to page=2 when page param is non-numeric', () => {
    mockSearchParams.set('page', 'abc');

    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=2');

    mockSearchParams.delete('page');
  });

  it('renders no list items when hits array is empty', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      ...baseHitsState,
      isLastPage: true,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    const { container } = render(<InfiniteHits hitComponent={() => <div />} />);
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
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

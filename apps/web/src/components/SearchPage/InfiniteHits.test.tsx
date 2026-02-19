import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('react-instantsearch', () => ({
  useInfiniteHits: vi.fn(() => ({
    hits: [
      {
        objectID: 'hit-1',
        title: 'Hit One',
        __position: 1,
        __queryID: 'query-1',
      } as Hit,
    ],
    isLastPage: true,
    showMore: mockShowMore,
    sendEvent: mockSendEvent,
  })),
}));

// Default no-op IntersectionObserver for tests that don't need custom observer behaviour.
// vi.unstubAllGlobals() (called in afterEach) removes the setupTests stub, so we re-apply it.
class DefaultIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn();
  constructor() {}
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
    // Mock IntersectionObserver
    const observe = vi.fn();
    const disconnect = vi.fn();

    class MockObserver {
      constructor(callback: IntersectionObserverCallback) {
        // Trigger callback immediately to simulate intersection
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockObserver);

    // Must mock useInfiniteHits to return isLastPage: false
    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    const HitComponent = () => <div>Hit</div>;
    render(<InfiniteHits hitComponent={HitComponent} />);

    expect(mockShowMore).toHaveBeenCalled();
  });

  it('does not call showMore when isLastPage is true even if sentinel intersects', () => {
    class MockObserver {
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

    vi.stubGlobal('IntersectionObserver', MockObserver);

    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
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
      constructor() {}
    }

    vi.stubGlobal('IntersectionObserver', MockObserver);

    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
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
      hits: [],
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toBeInTheDocument();
  });

  it('hides "Show more results" link on last page', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
      isLastPage: true,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.queryByText('Show more results')).not.toBeInTheDocument();
  });

  it('nextPageHref defaults to page=2 when no page param is present', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
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
      hits: [],
      isLastPage: false,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    render(<InfiniteHits hitComponent={() => <div />} />);
    expect(screen.getByText('Show more results')).toHaveAttribute('href', '?page=4');

    mockSearchParams.delete('page');
  });

  it('renders no list items when hits array is empty', () => {
    vi.mocked(useInfiniteHits).mockReturnValue({
      hits: [],
      isLastPage: true,
      showMore: mockShowMore,
      sendEvent: mockSendEvent,
    });

    const { container } = render(<InfiniteHits hitComponent={() => <div />} />);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

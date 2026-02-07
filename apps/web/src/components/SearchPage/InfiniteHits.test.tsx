import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import InfiniteHits from './InfiniteHits';
import { useInfiniteHits } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';

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

describe('InfiniteHits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('sends view events for new hits', () => {
    const HitComponent = ({ hit }: { hit: Hit }) => <div>{hit.objectID}</div>;

    const { rerender } = render(<InfiniteHits hitComponent={HitComponent} />);

    expect(mockSendEvent).toHaveBeenCalledWith(
      'view',
      expect.arrayContaining([expect.objectContaining({ objectID: 'hit-1' })]),
      'Search Results Viewed',
      expect.objectContaining({
        objectIDs: expect.arrayContaining(['hit-1']),
      })
    );

    // Render again to ensure we do not send duplicate views for same hit
    rerender(<InfiniteHits hitComponent={HitComponent} />);
    expect(mockSendEvent).toHaveBeenCalledTimes(1);
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
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsGrid from './ResultsGrid';
import { useHits, useInstantSearch } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';

const mockSendEvent = vi.fn();

vi.mock('react-instantsearch', () => ({
  useHits: vi.fn(),
  useInstantSearch: vi.fn(() => ({ status: 'idle' })),
}));

const defaultHit: Hit = { objectID: 'h1', title: 'Default Hit', __position: 1 };

const baseState = {
  items: [defaultHit] as Hit[],
  hits: [defaultHit] as Hit[],
  sendEvent: mockSendEvent,
  bindEvent: vi.fn(() => ''),
  results: { nbHits: 1 },
};

describe('ResultsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInstantSearch).mockReturnValue({ status: 'idle' } as never);
    vi.mocked(useHits).mockReturnValue(baseState as never);
  });

  it('passes sendEvent to the hit component', () => {
    const HitComponent = vi.fn(({ hit }) => <div>{String(hit.title)}</div>);
    render(<ResultsGrid hitComponent={HitComponent} />);
    expect(HitComponent).toHaveBeenCalledWith(
      expect.objectContaining({ sendEvent: mockSendEvent }),
      undefined
    );
  });

  it('renders the current page of hits', () => {
    render(<ResultsGrid hitComponent={({ hit }) => <div>{String(hit.title)}</div>} />);
    expect(screen.getByText('Default Hit')).toBeInTheDocument();
  });

  it('renders the empty state when there are no items and status is idle', () => {
    vi.mocked(useHits).mockReturnValue({ ...baseState, items: [], hits: [] } as never);
    render(<ResultsGrid hitComponent={() => <div />} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('renders nothing while loading with no items', () => {
    vi.mocked(useInstantSearch).mockReturnValue({ status: 'loading' } as never);
    vi.mocked(useHits).mockReturnValue({ ...baseState, items: [], hits: [] } as never);
    const { container } = render(<ResultsGrid hitComponent={() => <div />} />);
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('applies custom classNames to root, list, and item', () => {
    const { container } = render(
      <ResultsGrid hitComponent={() => <div />} classNames={{ root: 'r', list: 'l', item: 'i' }} />
    );
    expect(container.querySelector('.r')).toBeInTheDocument();
    expect(container.querySelector('.l')).toBeInTheDocument();
    expect(container.querySelector('.i')).toBeInTheDocument();
  });
});

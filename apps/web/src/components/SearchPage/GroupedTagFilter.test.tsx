import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupedTagFilter from './GroupedTagFilter';
import { useRefinementList } from 'react-instantsearch';

vi.mock('react-instantsearch', () => ({
  useRefinementList: vi.fn(),
}));

describe('GroupedTagFilter', () => {
  const mockRefine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no items', () => {
    vi.mocked(useRefinementList).mockReturnValue({
      items: [],
      refine: mockRefine,
      canRefine: false,
      canToggleShowMore: false,
      isFromSearch: false,
      isShowingMore: false,
      searchForItems: vi.fn(),
      toggleShowMore: vi.fn(),
      sendEvent: vi.fn(),
      createURL: vi.fn(),
    });

    const { container } = render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders parent items without children', () => {
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Standalone',
              value: 'standalone',
              count: 5,
              isRefined: false,
              highlighted: 'Standalone',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [],
        refine: mockRefine,
        canRefine: false,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);
    expect(screen.getByText('Standalone')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders parent items with children collapsed by default', () => {
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Events',
              value: 'Events',
              count: 10,
              isRefined: false,
              highlighted: 'Events',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Conference',
          },
          {
            label: 'Events > Meetup',
            value: 'Events > Meetup',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Meetup',
          },
        ],
        refine: mockRefine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.queryByText('Conference')).not.toBeInTheDocument();
    expect(screen.queryByText('Meetup')).not.toBeInTheDocument();
  });

  it('handles mixed parent items with and without children', () => {
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Events',
              value: 'Events',
              count: 10,
              isRefined: false,
              highlighted: 'Events',
            },
            {
              label: 'Standalone',
              value: 'Standalone',
              count: 5,
              isRefined: false,
              highlighted: 'Standalone',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Conference',
          },
        ],
        refine: mockRefine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Standalone')).toBeInTheDocument();
  });

  it('expands children when expand button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Events',
              value: 'Events',
              count: 10,
              isRefined: false,
              highlighted: 'Events',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Conference',
          },
          {
            label: 'Events > Meetup',
            value: 'Events > Meetup',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Meetup',
          },
        ],
        refine: mockRefine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    const expandButton = screen.getByLabelText('Expand Events subtags');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Conference')).toBeInTheDocument();
      expect(screen.getByText('Meetup')).toBeInTheDocument();
    });
  });

  it('collapses children when collapse button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Events',
              value: 'Events',
              count: 10,
              isRefined: false,
              highlighted: 'Events',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Conference',
          },
        ],
        refine: mockRefine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    const expandButton = screen.getByLabelText('Expand Events subtags');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Conference')).toBeInTheDocument();
    });

    const collapseButton = screen.getByLabelText('Collapse Events subtags');
    await user.click(collapseButton);

    await waitFor(() => {
      expect(screen.queryByText('Conference')).not.toBeInTheDocument();
    });
  });

  it('calls refine for standalone items when checkbox is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Standalone',
              value: 'standalone',
              count: 5,
              isRefined: false,
              highlighted: 'Standalone',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [],
        refine: mockRefine,
        canRefine: false,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    const checkbox = screen.getByRole('checkbox', { name: /standalone/i });
    await user.click(checkbox);

    expect(mockRefine).toHaveBeenCalledWith('standalone');
  });

  it('auto-selects all children when parent is refined via URL', async () => {
    const lvl1Refine = vi.fn();
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            { label: 'Events', value: 'Events', count: 10, isRefined: true, highlighted: 'Events' },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: false,
            highlighted: 'Events > Conference',
          },
          {
            label: 'Events > Meetup',
            value: 'Events > Meetup',
            count: 3,
            isRefined: false,
            highlighted: 'Events > Meetup',
          },
        ],
        refine: lvl1Refine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    await waitFor(() => {
      expect(lvl1Refine).toHaveBeenCalledWith('Events > Conference');
      expect(lvl1Refine).toHaveBeenCalledWith('Events > Meetup');
    });
  });

  it('sets indeterminate state when some children are refined', () => {
    vi.mocked(useRefinementList).mockImplementation(({ attribute }) => {
      if (attribute === 'tags.lvl0') {
        return {
          items: [
            {
              label: 'Events',
              value: 'Events',
              count: 10,
              isRefined: false,
              highlighted: 'Events',
            },
          ],
          refine: mockRefine,
          canRefine: true,
          canToggleShowMore: false,
          isFromSearch: false,
          isShowingMore: false,
          searchForItems: vi.fn(),
          toggleShowMore: vi.fn(),
          sendEvent: vi.fn(),
          createURL: vi.fn(),
        };
      }
      return {
        items: [
          {
            label: 'Events > Conference',
            value: 'Events > Conference',
            count: 5,
            isRefined: true,
            highlighted: 'Events > Conference',
          },
          {
            label: 'Events > Meetup',
            value: 'Events > Meetup',
            count: 3,
            isRefined: false,
            highlighted: 'Events > Meetup',
          },
        ],
        refine: mockRefine,
        canRefine: true,
        canToggleShowMore: false,
        isFromSearch: false,
        isShowingMore: false,
        searchForItems: vi.fn(),
        toggleShowMore: vi.fn(),
        sendEvent: vi.fn(),
        createURL: vi.fn(),
      };
    });

    render(<GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /filter by events/i,
    }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });
});

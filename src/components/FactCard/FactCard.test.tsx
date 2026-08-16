import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockHit } from '@/test-utils/fixtures';
import FactCard from './FactCard';

vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span>{String(hit[attribute] ?? '')}</span>
  ),
}));

describe('FactCard', () => {
  const sendEvent = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the compact front face with evidence metadata', () => {
    render(<FactCard hit={createMockHit({ created_at: '2026-05-24T21:42:51Z' })} position={6} />);

    expect(screen.getByRole('heading', { name: 'Test Fact Title' })).toBeInTheDocument();
    expect(screen.getByText(/№ 06 · Project Alpha · May 2026/)).toBeInTheDocument();
    expect(screen.getByText('Work Style')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open note/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens locally, tracks once, and moves focus to the visible face', async () => {
    const user = userEvent.setup();
    const hit = createMockHit();
    render(<FactCard hit={hit} sendEvent={sendEvent} />);

    const open = screen.getByRole('button', { name: /Open note/i });
    await user.click(open);

    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(sendEvent).toHaveBeenCalledWith('click', hit, 'Note Opened');
    await waitFor(() => expect(screen.getByRole('button', { name: /Close note/i })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: /Close note/i }));
    await user.click(open);
    expect(sendEvent).toHaveBeenCalledTimes(1);
  });

  it('moves focus into a note promoted from the reading queue', async () => {
    render(<FactCard hit={createMockHit()} focusOnMount />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Open note/i })).toHaveFocus());
  });

  it('closes with Escape and restores focus to the opener', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const open = screen.getByRole('button', { name: /Open note/i });
    await user.click(open);
    await user.keyboard('{Escape}');

    expect(open).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(open).toHaveFocus());
  });

  it('exposes a permalink and safe DEV evidence only on the back face', async () => {
    const user = userEvent.setup();
    render(
      <FactCard hit={createMockHit({ url: 'https://dev.to/user/post', objectID: 'card:test:1' })} />
    );

    await user.click(screen.getByRole('button', { name: /Open note/i }));

    expect(screen.getByRole('link', { name: /Permalink/i })).toHaveAttribute(
      'href',
      '/notes/card%3Atest%3A1'
    );
    expect(screen.getByRole('link', { name: /Read on DEV/i })).toHaveAttribute(
      'href',
      'https://dev.to/user/post'
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,bad', undefined])(
    'does not expose unsafe or missing evidence URL %j',
    async (url) => {
      const user = userEvent.setup();
      render(<FactCard hit={createMockHit({ url })} />);
      await user.click(screen.getByRole('button', { name: /Open note/i }));

      expect(
        screen.queryByRole('link', { name: /View source|Read on DEV/i })
      ).not.toBeInTheDocument();
    }
  );

  it('renders fallbacks when optional note fields are absent', async () => {
    const user = userEvent.setup();
    render(
      <FactCard
        hit={createMockHit({
          content: '',
          fact: '',
          blurb: '',
          category: '',
          projects: [],
          'tags.lvl0': [],
          'tags.lvl1': [],
          created_at: 'bad-date',
        })}
      />
    );

    expect(screen.getAllByText('No detail available.')).toHaveLength(2);
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText(/№ 01 · System Notes/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open note/i }));
    expect(screen.queryByText('Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Topics' })).not.toBeInTheDocument();
  });

  it('removes the Escape listener after closing', async () => {
    render(<FactCard hit={createMockHit()} />);
    fireEvent.click(screen.getByRole('button', { name: /Open note/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByRole('button', { name: /Open note/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactCard from './FactCard';
import { createMockHit } from '@/test-utils/fixtures';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockSendEvent = vi.fn();

vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span data-testid={`highlight-${attribute}`}>{String(hit[attribute])}</span>
  ),
}));

describe('FactCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fact card with front-side fields and project label', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText('Work Style')).toBeInTheDocument();
    // First project becomes the top label (counter style); secondary projects no longer render.
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });

  it('falls back to FACT counter when the hit has no projects', () => {
    render(<FactCard hit={createMockHit({ projects: [], __position: 7 })} />);
    expect(screen.getByText('FACT · 07')).toBeInTheDocument();
  });

  it('shows the created date as month + year when present, omits it otherwise', () => {
    const { unmount } = render(
      <FactCard hit={createMockHit({ created_at: '2026-05-24T21:42:51Z' })} />
    );
    expect(screen.getByText('May 2026')).toBeInTheDocument();
    unmount();

    render(<FactCard hit={createMockHit({ created_at: undefined })} />);
    expect(screen.queryByText('May 2026')).not.toBeInTheDocument();
  });

  it('renders category label', () => {
    render(<FactCard hit={createMockHit({ category: 'Philosophy' })} />);
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  it('renders content fallback when fact is missing', () => {
    render(<FactCard hit={createMockHit({ blurb: '', fact: '', content: 'Fallback content' })} />);
    expect(screen.getByText('Fallback content...')).toBeInTheDocument();
  });

  it('flips card on click', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });
    expect(cardButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(cardButton);
    expect(cardButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders without project label when projects is empty', () => {
    render(<FactCard hit={createMockHit({ projects: [] })} />);
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });

  it('renders leaf topic tags on the front', () => {
    render(
      <FactCard
        hit={createMockHit({
          'tags.lvl0': ['Engineering', 'Design'],
          'tags.lvl1': ['Engineering > TypeScript', 'Engineering > React', 'Design > Motion'],
        })}
      />
    );

    // Back is always in the DOM (it's the rear face of the 3D flip),
    // hidden via aria-hidden until the card is flipped.
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Motion')).toBeInTheDocument();
  });

  it('has correct structure for accessibility', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Click to expand/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Click to expand/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Test Fact Title' })).toBeInTheDocument();
  });

  it.each([
    { key: '{Enter}', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])('supports keyboard navigation with $label', async ({ key }) => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Click to expand/i });
    card.focus();
    await user.keyboard(key);

    expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  it('tracks expansion event with insights client', async () => {
    const user = userEvent.setup();
    const hit = createMockHit();
    render(<FactCard hit={hit} sendEvent={mockSendEvent} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });
    await user.click(cardButton);

    expect(mockSendEvent).toHaveBeenCalledWith('click', hit, 'Fact Card Viewed');
  });

  it('only tracks expansion once per card instance', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} sendEvent={mockSendEvent} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });

    await user.click(cardButton);
    await user.click(cardButton);

    expect(mockSendEvent).toHaveBeenCalledTimes(1);
  });

  it('does not track when sendEvent is not provided', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });
    await user.click(cardButton);

    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('renders GitHub link on the front for GitHub URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://github.com/user/repo' })} />);

    expect(screen.getByLabelText('View source for Test Fact Title')).toBeInTheDocument();
  });

  it('does not render GitHub link for DEV.to URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://dev.to/user/post-title' })} />);

    expect(screen.queryByLabelText('View source for Test Fact Title')).not.toBeInTheDocument();
  });

  it('renders DEV icon on the front for DEV.to URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://dev.to/user/post-title' })} />);

    expect(screen.getByLabelText(/Read .* on DEV Community/i)).toBeInTheDocument();
  });

  it('does not render DEV icon for GitHub URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://github.com/user/repo' })} />);

    expect(screen.queryByLabelText(/Read .* on DEV Community/i)).not.toBeInTheDocument();
  });

  it('does not render DEV icon when no URL is present', () => {
    render(<FactCard hit={createMockHit({ url: undefined })} />);

    expect(screen.queryByLabelText(/Read .* on DEV Community/i)).not.toBeInTheDocument();
  });

  it('renders default category label when category is empty', () => {
    render(<FactCard hit={createMockHit({ category: '' })} />);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('handles hit with no content, fact, or blurb gracefully', () => {
    render(<FactCard hit={createMockHit({ blurb: '', fact: '', content: '' })} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('handles very long title without crashing', () => {
    const longTitle = 'A'.repeat(500);
    render(<FactCard hit={createMockHit({ title: longTitle })} />);
    expect(screen.getByTestId('highlight-title')).toHaveTextContent(longTitle);
  });

  it('does not render source link when url is missing', () => {
    render(<FactCard hit={createMockHit({ url: undefined })} />);
    expect(screen.queryByLabelText(/View source/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Read .* on DEV/)).not.toBeInTheDocument();
  });

  it('closes card via keyboard when already flipped', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });
    await user.click(cardButton);
    expect(cardButton).toHaveAttribute('aria-expanded', 'true');

    cardButton.focus();
    await user.keyboard(' ');
    expect(cardButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes flipped card via Escape key', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardButton = screen.getByRole('button', { name: /Click to expand/i });
    await user.click(cardButton);
    expect(cardButton).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(cardButton).toHaveAttribute('aria-expanded', 'false');
  });
});

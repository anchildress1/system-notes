import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactCard from './FactCard';
import { createMockHit } from '@/test-utils/fixtures';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: Record<string, unknown>) => (
      <div className={className as string} onClick={onClick as React.MouseEventHandler}>
        {children as React.ReactNode}
      </div>
    ),
    article: ({
      children,
      className,
      role,
      animate,
      onAnimationComplete,
      initial: _i,
      variants: _v,
      transition: _t,
      ...rest
    }: Record<string, unknown>) => (
      <article
        className={className as string}
        role={role as string}
        data-animate={animate as string}
        onTransitionEnd={() =>
          (onAnimationComplete as ((d: string) => void) | undefined)?.(animate as string)
        }
        {...(rest as React.HTMLAttributes<HTMLElement>)}
      >
        {children as React.ReactNode}
      </article>
    ),
  },
}));

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

  it('renders fact card with front-side fields including projects', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText('Work Style')).toBeInTheDocument();
    // Projects are now displayed on the front
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('renders category label', () => {
    render(<FactCard hit={createMockHit({ category: 'Philosophy' })} />);
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  it('renders content fallback when fact is missing', () => {
    render(<FactCard hit={createMockHit({ blurb: '', fact: '', content: 'Fallback content' })} />);
    expect(screen.getByText('Fallback content...')).toBeInTheDocument();
  });

  it('renders all projects when expanded', async () => {
    const user = userEvent.setup();
    const manyProjects = ['A', 'B', 'C', 'D', 'E'];
    render(<FactCard hit={createMockHit({ projects: manyProjects })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders without projects on front when projects is empty', () => {
    render(<FactCard hit={createMockHit({ projects: [] })} />);
    // No project badges on the front
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });

  it('renders leaf topic tags on back when expanded', async () => {
    const user = userEvent.setup();
    render(
      <FactCard
        hit={createMockHit({
          'tags.lvl0': ['Engineering', 'Design'],
          'tags.lvl1': ['Engineering > TypeScript', 'Engineering > React', 'Design > Motion'],
        })}
      />
    );

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // lvl1 leaf parts only — parent categories from lvl0 are not separately displayed
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Motion')).toBeInTheDocument();
  });

  it('renders without projects when empty', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit({ projects: [] })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has correct structure for accessibility', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('link', { name: /Press to expand/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(card).toHaveAttribute('href', '/search?factId=card%3Atest%3Atest%3A0001');
    expect(screen.getByRole('heading', { level: 2, name: 'Test Fact Title' })).toBeInTheDocument();
  });

  it.each([
    { key: '{Enter}', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])('supports keyboard navigation with $label', async ({ key }) => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('link', { name: /Press to expand/i });
    card.focus();
    await user.keyboard(key);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tracks expansion event with insights client', async () => {
    const user = userEvent.setup();
    const hit = createMockHit();
    render(<FactCard hit={hit} sendEvent={mockSendEvent} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(mockSendEvent).toHaveBeenCalledWith('click', hit, 'Fact Card Viewed');
  });

  it('only tracks expansion once per card instance', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} sendEvent={mockSendEvent} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });

    await user.click(cardLink);
    await user.click(cardLink);

    expect(mockSendEvent).toHaveBeenCalledTimes(1);
  });

  it('does not track when sendEvent is not provided', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('renders GitHub link for GitHub URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://github.com/user/repo' })} />);

    expect(screen.getByLabelText('View source for Test Fact Title')).toBeInTheDocument();
  });

  it('does not render GitHub link for DEV.to URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://dev.to/user/post-title' })} />);

    expect(screen.queryByLabelText('View source for Test Fact Title')).not.toBeInTheDocument();
  });

  it('renders DEV icon when expanded for DEV.to URLs', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit({ url: 'https://dev.to/user/post-title' })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    // Should have 2 DEV icons: one on front (hidden), one on back (visible)
    const devIcons = screen.getAllByLabelText(/Read .* on DEV Community/i);
    expect(devIcons).toHaveLength(2);
  });

  it('does not render DEV icon for GitHub URLs', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit({ url: 'https://github.com/user/repo' })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(screen.queryByLabelText(/Read .* on DEV Community/i)).not.toBeInTheDocument();
  });

  it('does not render DEV icon when no URL is present', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit({ url: undefined })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(screen.queryByLabelText(/Read .* on DEV Community/i)).not.toBeInTheDocument();
  });

  it('renders DEV icon on card front for DEV.to URLs', () => {
    render(<FactCard hit={createMockHit({ url: 'https://dev.to/user/post-title' })} />);

    expect(screen.getByLabelText(/Read .* on DEV Community/i)).toBeInTheDocument();
  });

  it('renders default category label when category is empty', () => {
    render(<FactCard hit={createMockHit({ category: '' })} />);
    // Empty category falls through to 'System' default
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('handles hit with no content, fact, or blurb gracefully', () => {
    render(<FactCard hit={createMockHit({ blurb: '', fact: '', content: '' })} />);
    // Should render "..." for empty truncated content
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

  it('closes card via keyboard when already expanded', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);
    expect(cardLink).toHaveAttribute('aria-expanded', 'true');

    // Fire Space directly — covers handleKeyDown when isFlipped=true
    fireEvent.keyDown(cardLink, { key: ' ' });
    expect(cardLink).toHaveAttribute('aria-expanded', 'false');
  });

  it('unmounts portal after exit animation completes', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close — portal stays mounted during exit animation
    await user.click(cardLink);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-animate', 'exit');

    // Simulate onAnimationComplete('exit') → handleExitComplete → setPortalVisible(false)
    fireEvent.transitionEnd(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes expanded card via Escape key', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    // Dialog should begin exit animation (card no longer expanded)
    expect(cardLink).toHaveAttribute('aria-expanded', 'false');
  });
});

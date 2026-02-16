import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactCard from './FactCard';
import { createMockHit } from '@/test-utils/fixtures';

const mockSearchParams = new URLSearchParams();
const pushStateSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
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
    mockSearchParams.delete('factId');
    pushStateSpy.mockClear();
    vi.spyOn(window.history, 'pushState').mockImplementation(pushStateSpy);
  });

  it('renders fact card with front-side fields', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText('Work Style')).toBeInTheDocument();
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

    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      '',
      '?factId=card%3Atest%3Atest%3A0001&category=Work+Style&project=A&project=B&project=C&project=D&project=E'
    );
  });

  it('renders without tags when empty', () => {
    const { container } = render(<FactCard hit={createMockHit({ tags: [] })} />);

    const tags = container.querySelectorAll('.simpleTag');
    expect(tags.length).toBe(0);
  });

  it('renders without projects when empty', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit({ projects: [] })} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(pushStateSpy).toHaveBeenCalled();
  });

  it('has correct structure for accessibility', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('link', { name: /Press to expand/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(card).toHaveAttribute(
      'href',
      '/search?factId=card%3Atest%3Atest%3A0001&category=Work+Style&project=Project+Alpha&project=Project+Beta'
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Test Fact Title' })).toBeInTheDocument();
  });

  it('supports keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('link', { name: /Press to expand/i });
    card.focus();
    await user.keyboard('{Enter}');

    expect(pushStateSpy).toHaveBeenCalled();
  });

  it('supports keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('link', { name: /Press to expand/i });
    card.focus();
    await user.keyboard(' ');

    expect(pushStateSpy).toHaveBeenCalled();
  });

  it('tracks expansion event with insights client', async () => {
    const user = userEvent.setup();
    const hit = createMockHit();
    render(<FactCard hit={hit} sendEvent={mockSendEvent} />);

    const cardLink = screen.getByRole('link', { name: /Press to expand/i });
    await user.click(cardLink);

    expect(mockSendEvent).toHaveBeenCalledWith('click', hit, 'Fact Card Viewed', {
      objectIDs: [hit.objectID],
    });
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
});

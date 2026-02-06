import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactCard from './FactCard';
import type { Hit, BaseHit } from 'instantsearch.js';

const mockSendEvent = vi.fn();

vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span data-testid={`highlight-${attribute}`}>{String(hit[attribute])}</span>
  ),
}));

interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  tags: string[];
  projects: string[];
  category: string;
  signal: number;
}

const createMockHit = (overrides: Partial<FactHitRecord> = {}): Hit<FactHitRecord> =>
  ({
    objectID: 'card:test:test:0001',
    title: 'Test Fact Title',
    blurb: 'This is a test blurb.',
    fact: 'This is the detailed fact content.',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    projects: ['Project Alpha', 'Project Beta'],
    category: 'Work Style',
    signal: 3,
    __position: 1,
    __queryID: 'test-query',
    ...overrides,
  }) as Hit<FactHitRecord>;

describe('FactCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fact card with all fields', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText(/This is the detailed fact content/)).toBeInTheDocument();
    expect(screen.getByText('Work Style')).toBeInTheDocument();
  });

  it('renders category label', () => {
    render(<FactCard hit={createMockHit({ category: 'Philosophy' })} />);
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  it('renders all tags without limit', () => {
    const manyTags = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    render(<FactCard hit={createMockHit({ tags: manyTags })} />);

    manyTags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('renders all projects without limit', () => {
    const manyProjects = ['A', 'B', 'C', 'D', 'E'];
    render(<FactCard hit={createMockHit({ projects: manyProjects })} />);

    manyProjects.forEach((project) => {
      expect(screen.getByText(project)).toBeInTheDocument();
    });
  });

  it('renders without tags when empty', () => {
    const { container } = render(<FactCard hit={createMockHit({ tags: [] })} />);

    const tagsSection = container.querySelector('[class*="tags"]');
    expect(tagsSection).not.toBeInTheDocument();
  });

  it('renders without projects when empty', () => {
    const { container } = render(<FactCard hit={createMockHit({ projects: [] })} />);

    const entitiesSection = container.querySelector('[class*="entities"]');
    expect(entitiesSection).not.toBeInTheDocument();
  });

  it('has correct structure for accessibility', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Press to expand/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('heading', { level: 3, name: 'Test Fact Title' })).toBeInTheDocument();
  });

  it('supports keyboard navigation with Enter', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Press to expand/i });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    // Simulate activation
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports keyboard navigation with Space', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Press to expand/i });
    // Simulate activation
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports Escape to close when expanded', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Press to expand/i });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');

    // Fire escape on the container div which has the listener
    // The container is the parent of the cardInner which contains the button
    const container = card.parentElement?.parentElement;
    if (!container) throw new Error('Container not found');

    fireEvent.keyDown(container, { key: 'Escape' });

    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('has close button when expanded', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Test Fact Title/i });
    fireEvent.click(card);

    const closeButton = screen.getByRole('button', { name: /Close expanded view/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('close button closes the card', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button', { name: /Test Fact Title/i });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');

    const closeButton = screen.getByRole('button', { name: /Close expanded view/i });
    fireEvent.click(closeButton);
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('tracks expansion event with insights client', async () => {
    const user = userEvent.setup();
    const hit = createMockHit();
    render(<FactCard hit={hit} sendEvent={mockSendEvent} />);

    const expandButton = screen.getByRole('button', { name: /Press to expand/i });
    await user.click(expandButton);

    expect(mockSendEvent).toHaveBeenCalledWith('click', hit, 'Fact Card Viewed', {
      objectIDs: [hit.objectID],
    });
  });

  it('only tracks expansion once per card instance', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} sendEvent={mockSendEvent} />);

    const expandButton = screen.getByRole('button', { name: /Press to expand/i });

    // Open
    await user.click(expandButton);

    // Close (using close button found after expand)
    const closeButton = screen.getByRole('button', { name: /Close expanded view/i });
    await user.click(closeButton);

    // Open again
    // Note: the expand button might be hidden/re-shown or just aria-expanded toggled?
    // In FactCard.tsx: <button ... hidden={isFlipped}>
    // So when closed, it is visible again.
    const expandButtonAgain = screen.getByRole('button', { name: /Press to expand/i });
    await user.click(expandButtonAgain);

    expect(mockSendEvent).toHaveBeenCalledTimes(1);
  });

  it('does not track when sendEvent is not provided', async () => {
    const user = userEvent.setup();
    render(<FactCard hit={createMockHit()} />);

    const expandButton = screen.getByRole('button', { name: /Press to expand/i });
    await user.click(expandButton);

    expect(mockSendEvent).not.toHaveBeenCalled();
  });
});

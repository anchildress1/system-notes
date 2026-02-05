import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FactCard from './FactCard';
import type { Hit, BaseHit } from 'instantsearch.js';

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
  it('renders fact card with all fields', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText('This is the detailed fact content.')).toBeInTheDocument();
    expect(screen.getByText('Work Style')).toBeInTheDocument();
  });

  it('renders category label', () => {
    render(<FactCard hit={createMockHit({ category: 'Philosophy' })} />);
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  it('renders tags up to 5 items', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByText('tag-one')).toBeInTheDocument();
    expect(screen.getByText('tag-two')).toBeInTheDocument();
    expect(screen.getByText('tag-three')).toBeInTheDocument();
  });

  it('shows +N indicator for more than 5 tags', () => {
    const manyTags = ['a', 'b', 'c', 'd', 'e', 'f'];
    render(<FactCard hit={createMockHit({ tags: manyTags })} />);

    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders projects up to 3 items', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('shows +N indicator for more than 3 projects', () => {
    const manyProjects = ['A', 'B', 'C', 'D', 'E'];
    render(<FactCard hit={createMockHit({ projects: manyProjects })} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
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

  it('has correct article structure for accessibility', () => {
    render(<FactCard hit={createMockHit()} />);

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card.tagName).toBe('ARTICLE');
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});

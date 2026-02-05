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
  entities: string[];
  domain: string;
  signal_level: number;
}

const createMockHit = (overrides: Partial<FactHitRecord> = {}): Hit<FactHitRecord> =>
  ({
    objectID: 'card:test:test:0001',
    title: 'Test Fact Title',
    blurb: 'This is a test blurb.',
    fact: 'This is the detailed fact content.',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    entities: ['Project Alpha', 'Project Beta'],
    domain: 'work_style',
    signal_level: 1,
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
    expect(screen.getByText('work style')).toBeInTheDocument();
  });

  it('renders domain with underscores replaced', () => {
    render(<FactCard hit={createMockHit({ domain: 'technical_decisions' })} />);
    expect(screen.getByText('technical decisions')).toBeInTheDocument();
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

  it('renders entities up to 3 items', () => {
    render(<FactCard hit={createMockHit()} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('shows +N indicator for more than 3 entities', () => {
    const manyEntities = ['A', 'B', 'C', 'D', 'E'];
    render(<FactCard hit={createMockHit({ entities: manyEntities })} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders without tags when empty', () => {
    const { container } = render(<FactCard hit={createMockHit({ tags: [] })} />);

    const tagsSection = container.querySelector('[class*="tags"]');
    expect(tagsSection).not.toBeInTheDocument();
  });

  it('renders without entities when empty', () => {
    const { container } = render(<FactCard hit={createMockHit({ entities: [] })} />);

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

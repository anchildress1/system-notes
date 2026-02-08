import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnifiedHitCard from './UnifiedHitCard';
import type { Hit } from 'instantsearch.js';

interface BaseHitRecord {
  objectID: string;
  title: string;
  url?: string;
  blurb?: string;
  fact: string;
  category: string;
  [key: string]: unknown;
}

// Mock child components to verify which one renders
vi.mock('../PostCard/PostCard', () => ({
  default: ({ hit }: { hit: Hit<BaseHitRecord> }) => (
    <div data-testid="post-card">Post: {hit.title}</div>
  ),
}));

vi.mock('../FactCard/FactCard', () => ({
  default: ({ hit }: { hit: Hit<BaseHitRecord> }) => (
    <div data-testid="fact-card">Fact: {hit.title}</div>
  ),
}));

const createMockHit = (overrides: Partial<BaseHitRecord> = {}): Hit<BaseHitRecord> =>
  ({
    objectID: '1',
    title: 'Test Hit',
    blurb: 'Test blurb',
    fact: 'Test fact',
    category: 'Test',
    ...overrides,
  }) as Hit<BaseHitRecord>;

describe('UnifiedHitCard', () => {
  it('renders PostCard when hit has a url', () => {
    const hit = createMockHit({ url: 'https://example.com' });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('post-card')).toBeInTheDocument();
    expect(screen.queryByTestId('fact-card')).not.toBeInTheDocument();
  });

  it('renders PostCard when hit blurb starts with http', () => {
    const hit = createMockHit({ blurb: 'https://example.com/blog' });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('post-card')).toBeInTheDocument();
    expect(screen.queryByTestId('fact-card')).not.toBeInTheDocument();
  });

  it('renders FactCard when hit has no url and blurb is text', () => {
    const hit = createMockHit({
      url: '',
      blurb: 'Just some text description',
    });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('fact-card')).toBeInTheDocument();
    expect(screen.queryByTestId('post-card')).not.toBeInTheDocument();
  });

  it('renders FactCard when blurb is missing', () => {
    const hit = createMockHit({
      url: '',
      blurb: undefined,
    });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('fact-card')).toBeInTheDocument();
  });
});

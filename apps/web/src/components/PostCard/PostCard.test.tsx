import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostCard, { PostHitRecord } from './PostCard';
import type { Hit } from 'instantsearch.js';

const mockSendEvent = vi.fn();

vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span data-testid={`highlight-${attribute}`}>{String(hit[attribute])}</span>
  ),
}));

const createMockHit = (overrides: Partial<PostHitRecord> = {}): Hit<PostHitRecord> =>
  ({
    objectID: 'post:test:0001',
    title: 'Test Post Title',
    url: 'https://example.com/post',
    blurb: 'https://example.com/post',
    fact: 'This is a test excerpt.',
    'tags.lvl0': ['blog'],
    'tags.lvl1': ['blog > tech'],
    category: 'Thoughts',
    __position: 1,
    __queryID: 'test-query',
    ...overrides,
  }) as Hit<PostHitRecord>;

describe('PostCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders post card with correct content', () => {
    const hit = createMockHit();
    render(<PostCard hit={hit} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Post Title');
    expect(screen.getByTestId('highlight-fact')).toHaveTextContent('This is a test excerpt.');
    expect(screen.getByText('Thoughts')).toBeInTheDocument();
  });

  it('renders correct tags', () => {
    const hit = createMockHit({
      'tags.lvl1': ['blog > tech', 'blog > ai'],
    });
    render(<PostCard hit={hit} />);

    expect(screen.getByText('blog > tech')).toBeInTheDocument();
    expect(screen.getByText('blog > ai')).toBeInTheDocument();
  });

  it('accepts sendEvent prop (even if unused for now)', () => {
    const hit = createMockHit();
    // This test primarily verifies the TypeScript interface and runtime acceptance
    render(<PostCard hit={hit} sendEvent={mockSendEvent} />);

    const link = screen.getByRole('link', { name: /Read post: Test Post Title/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/post');
  });

  it('renders read more link', () => {
    render(<PostCard hit={createMockHit()} />);
    expect(screen.getByText(/Read Post/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostCard, { PostHitRecord } from './PostCard';
import type { Hit } from 'instantsearch.js';

// Mock Highlight to render simple text
vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span data-testid={`highlight-${attribute}`}>{String(hit[attribute])}</span>
  ),
}));

const createMockHit = (overrides: Partial<PostHitRecord> = {}): Hit<PostHitRecord> =>
  ({
    objectID: 'post:123',
    title: 'Test Post Title',
    url: 'https://example.com/post',
    blurb: 'This is a test blurb.',
    fact: 'This is a short excerpt.',
    category: 'Engineering',
    'tags.lvl0': ['Tech'],
    'tags.lvl1': ['Tech > React', 'Tech > Testing'],
    _highlightResult: {},
    __position: 1,
    __queryID: 'test-query',
    ...overrides,
  }) as Hit<PostHitRecord>;

describe('PostCard', () => {
  it('renders basic post info', () => {
    render(<PostCard hit={createMockHit()} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Post Title');
    expect(screen.getByTestId('highlight-fact')).toHaveTextContent('This is a short excerpt.');
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('uses hit.url for link href', () => {
    const hit = createMockHit({ url: 'https://example.com/explicit' });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link', { name: /read post: test post title/i });
    expect(link).toHaveAttribute('href', 'https://example.com/explicit');
  });

  it('falls back to blurb as url if it starts with http', () => {
    const hit = createMockHit({
      url: '',
      blurb: 'https://example.com/fallback-blurb',
    });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/fallback-blurb');
  });

  it('falls back to objectID as url if neither url nor blurb are valid URLs', () => {
    const hit = createMockHit({
      url: '',
      blurb: 'Just a text blurb',
      objectID: '/posts/my-slug',
    });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/posts/my-slug');
  });

  it('renders tags from lvl1 if available', () => {
    const hit = createMockHit({
      'tags.lvl1': ['React', 'TypeScript'],
      'tags.lvl0': ['Tech'],
    });
    render(<PostCard hit={hit} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByText('Tech')).not.toBeInTheDocument();
  });

  it('renders tags from lvl0 if lvl1 is missing', () => {
    const hit = createMockHit({
      'tags.lvl0': ['Tech', 'Web'],
    });
    render(<PostCard hit={hit} />);

    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
  });

  it('limits displayed tags to 3', () => {
    const hit = createMockHit({
      'tags.lvl1': ['One', 'Two', 'Three', 'Four'],
    });
    render(<PostCard hit={hit} />);

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
    expect(screen.queryByText('Four')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostCard from './PostCard';
import { createMockHit } from '@/test-utils/fixtures';

// PostCard is now a re-export of FactCard — tests verify the unified component
// renders correctly with blog-post-style data (url present).

const mockSearchParams = new URLSearchParams();
const pushStateSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('react-instantsearch', () => ({
  Highlight: ({ attribute, hit }: { attribute: string; hit: Record<string, unknown> }) => (
    <span data-testid={`highlight-${attribute}`}>
      {String((hit as Record<string, unknown>)[attribute])}
    </span>
  ),
}));

describe('PostCard (FactCard re-export)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('factId');
    pushStateSpy.mockClear();
    vi.spyOn(window.history, 'pushState').mockImplementation(pushStateSpy);
  });

  it('renders basic post info', () => {
    render(<PostCard hit={createMockHit({ url: 'https://example.com/post' })} />);

    expect(screen.getByTestId('highlight-title')).toHaveTextContent('Test Fact Title');
    expect(screen.getByTestId('highlight-blurb')).toHaveTextContent('This is a test blurb.');
    expect(screen.getByText('Work Style')).toBeInTheDocument();
  });

  it('uses factId parameter in link href', () => {
    const hit = createMockHit({ objectID: 'my-post-123' });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link', { name: /Press to expand/i });
    expect(link.getAttribute('href')).toContain('factId=my-post-123');
  });

  it('includes category in search URL', () => {
    const hit = createMockHit({ category: 'Technology' });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('category=Technology');
  });

  it('creates search URL even with external post URL', () => {
    const hit = createMockHit({
      objectID: 'external-post',
      url: 'https://external.com/blog-post',
    });
    render(<PostCard hit={hit} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/search');
    expect(link.getAttribute('href')).toContain('factId=external-post');
  });

  it('renders GitHub link for GitHub URLs', () => {
    render(<PostCard hit={createMockHit({ url: 'https://github.com/test/repo' })} />);

    expect(screen.getByLabelText('View source for Test Fact Title')).toBeInTheDocument();
  });

  it('does not render GitHub link when URL is absent', () => {
    render(<PostCard hit={createMockHit({ url: undefined })} />);

    expect(screen.queryByLabelText('View source for Test Fact Title')).not.toBeInTheDocument();
  });

  it('does not render GitHub link for DEV.to URLs', () => {
    render(<PostCard hit={createMockHit({ url: 'https://dev.to/user/awesome-post' })} />);

    expect(screen.queryByLabelText('View source for Test Fact Title')).not.toBeInTheDocument();
  });

  it('has correct structure for accessibility', () => {
    render(<PostCard hit={createMockHit()} />);

    const link = screen.getByRole('link', { name: /Press to expand/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('aria-expanded', 'false');
  });
});

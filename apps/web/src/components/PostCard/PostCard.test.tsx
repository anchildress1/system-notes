import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard, { PostHitRecord } from './PostCard';
import type { Hit } from 'instantsearch.js';

// Mock Highlight to just render the text
vi.mock('react-instantsearch', () => ({
  Highlight: ({ hit, attribute }: { hit: Record<string, unknown>; attribute: string }) => {
    return <span>{hit[attribute] as React.ReactNode}</span>;
  },
}));

describe('PostCard', () => {
  const mockHit: Hit<PostHitRecord> = {
    objectID: 'post-1',
    title: 'Test Post',
    url: 'https://example.com/post-1',
    blurb: 'This is a test post blurb that should be displayed.',
    fact: 'This is a snippet of the fact.',
    category: 'Engineering',
    'tags.lvl1': ['Engineering > Testing'],
    __position: 1,
    __queryID: 'test-query-id',
  };

  const mockSendEvent = vi.fn();

  it('renders post content correctly', () => {
    render(<PostCard hit={mockHit} />);

    expect(screen.getByText('Test Post')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('This is a snippet of the fact.')).toBeDefined();
    expect(screen.getByText('Engineering > Testing')).toBeDefined();
    expect(screen.getByLabelText('Read post: Test Post')).toBeDefined();
  });

  it('renders link with correct url', () => {
    render(<PostCard hit={mockHit} />);
    const link = screen.getByRole('link', { name: /Read post: Test Post/i });
    expect(link.getAttribute('href')).toBe('https://example.com/post-1');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('calls sendEvent when clicked', () => {
    render(<PostCard hit={mockHit} sendEvent={mockSendEvent} />);
    const card = screen.getByRole('link');

    fireEvent.click(card);

    expect(mockSendEvent).toHaveBeenCalledWith(
      'click',
      mockHit,
      'Post Clicked',
      expect.objectContaining({
        objectIDs: ['post-1'],
      })
    );
  });

  it('falls back to objectID if url is missing', () => {
    const fallbackHit = {
      ...mockHit,
      url: '',
      blurb: 'Just text',
    } as Hit<PostHitRecord>;

    render(<PostCard hit={fallbackHit} />);
    const link = screen.getByRole('link');
    // Implementation uses objectID if URL is missing
    expect(link.getAttribute('href')).toBe('post-1');
  });
});

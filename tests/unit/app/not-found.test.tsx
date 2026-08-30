import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFoundPage, { metadata } from '@/app/not-found';

describe('NotFoundPage metadata', () => {
  it('titles itself rather than inheriting the home page', () => {
    // Without its own metadata this route took the layout's title and og:title
    // wholesale, so a dead link previewed as the home page under its name.
    expect(metadata.title).toEqual({ absolute: 'Page not found | Ashley’s System Notes' });
    expect(metadata.openGraph?.title).toBe('Page not found');
  });

  it('sets no robots directive of its own', () => {
    // Next already emits `noindex` for this route. A second directive here is
    // how the page ended up carrying two contradictory robots tags.
    expect(metadata.robots).toBeUndefined();
  });
});

describe('NotFoundPage', () => {
  it('keeps the redesign shell and skip-link target on missing routes', () => {
    const { container } = render(<NotFoundPage />);

    expect(container.querySelector('main#main-content')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /This trail ends without a note/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search the index/i })).toHaveAttribute(
      'href',
      '/notes'
    );
    expect(screen.getByRole('link', { name: /Browse projects/i })).toHaveAttribute(
      'href',
      '/projects'
    );
  });
});

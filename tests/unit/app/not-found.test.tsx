import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFoundPage, { metadata } from '@/app/not-found';
import { SITE_NAME, SOCIAL_IMAGE } from '@/lib/siteMetadata';

const openGraph = () => metadata.openGraph as Record<string, unknown> | undefined;

describe('NotFoundPage metadata', () => {
  it('titles itself rather than inheriting the home page', () => {
    expect(metadata.title).toEqual({ absolute: 'Page not found | Ashley’s System Notes' });
    expect(openGraph()?.title).toBe('Page not found | Ashley’s System Notes');
  });

  it('keeps the shared card the layout supplies', () => {
    // Next merges openGraph SHALLOWLY. Declaring a bare { title, description }
    // here replaced the layout's whole object and dropped the image, siteName,
    // locale and type with it — so a dead link previewed with no card at all,
    // which is worse than the home-page preview this route exists to correct.
    expect(openGraph()?.images).toEqual([SOCIAL_IMAGE]);
    expect(openGraph()?.siteName).toBe(SITE_NAME);
    expect(openGraph()?.type).toBe('website');
  });

  it('overrides the Twitter card too, not just Open Graph', () => {
    // twitter merges shallowly on the same terms, and leaving it untouched left
    // the 404 carrying the home page's title on that side.
    expect((metadata.twitter as Record<string, unknown>).title).toBe(
      'Page not found | Ashley’s System Notes'
    );
  });

  it('claims no canonical address', () => {
    // A 404 is not a page, so it has nowhere to point a canonical at.
    expect(metadata.alternates).toBeUndefined();
    expect(openGraph()?.url).toBeUndefined();
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

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteHeader from '@/components/SiteHeader/SiteHeader';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    navigation.pathname = '/';
  });

  it('renders plain-language navigation and a skip link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /Ashley Childress.*every choice/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('link', { name: 'the index' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'exhibits' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'about' })).toHaveAttribute('href', '/about');
  });

  it.each([
    ['/projects', 'exhibits'],
    ['/about', 'about'],
    ['/notes/card:test:1', 'the index'],
  ])('marks %s as the %s navigation surface', (pathname, label) => {
    navigation.pathname = pathname;

    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  it('states the index total and how long ago it last moved', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();

    render(<SiteHeader pulse={{ total: 279, latestCreatedAt: twoHoursAgo }} />);

    // The client snapshot resolves on the first client render, so the whole
    // phrase is present immediately rather than arriving a tick later.
    expect(screen.getByText(/entry № 279 logged 2h ago — the index never closes/)).toBeVisible();
  });

  it('states the total alone when the newest note carries no date', () => {
    render(<SiteHeader pulse={{ total: 279, latestCreatedAt: null }} />);

    expect(screen.getByText(/entry № 279 — the index never closes/)).toBeVisible();
    expect(screen.queryByText(/logged/)).not.toBeInTheDocument();
  });

  it('groups a large total rather than running the digits together', () => {
    render(<SiteHeader pulse={{ total: 12345, latestCreatedAt: null }} />);

    expect(screen.getByText(/entry № 12,345/)).toBeVisible();
  });

  it('falls back to the unnumbered line when the index cannot answer', () => {
    // The header is furniture on every page including the 404; a failed pulse
    // must not leave a gap or a zero where a real count belongs.
    render(<SiteHeader pulse={null} />);

    expect(screen.getByText(/the index never closes/)).toBeVisible();
    expect(screen.queryByText(/entry №/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\b0\b/)).not.toBeInTheDocument();
  });

  it('renders without a pulse prop at all', () => {
    render(<SiteHeader />);

    expect(screen.getByText(/the index never closes/)).toBeVisible();
    expect(screen.queryByText(/entry №/)).not.toBeInTheDocument();
  });

  it('identifies the blog as a safe external link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /blog/i })).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
});

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
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders plain-language navigation and a skip link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'Ashley Childress' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('link', { name: 'ask me a question' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'how I decide' })).toHaveAttribute('href', '/notes');
    expect(screen.getByRole('link', { name: 'what I’ve shipped' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(screen.getByRole('link', { name: 'about me' })).toHaveAttribute('href', '/about');
  });

  it.each([
    ['/projects', 'what I’ve shipped'],
    ['/about', 'about me'],
    ['/notes', 'how I decide'],
  ])('marks %s as the %s navigation surface', (pathname, label) => {
    navigation.pathname = pathname;

    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  it('carries the theme control', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('button', { name: 'Light theme' })).toBeVisible();
  });

  it('states nothing about the index it cannot keep current', () => {
    // The entry count and its age moved to the index itself. The header is on
    // every route including the 404, and a corpus statistic rendered there was
    // both a fetch every route paid for and a number with no context around it.
    render(<SiteHeader />);

    expect(screen.queryByText(/entry №/)).not.toBeInTheDocument();
    expect(screen.queryByText(/never closes/)).not.toBeInTheDocument();
  });

  it('carries no theme song', () => {
    // It lives under its own section on the about page, where the writing that
    // explains it is.
    render(<SiteHeader />);

    expect(screen.queryByRole('button', { name: /theme song/i })).not.toBeInTheDocument();
  });

  it('identifies the blog as a safe external link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /blog/i })).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
});

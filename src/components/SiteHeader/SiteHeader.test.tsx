import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteHeader from './SiteHeader';

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

  it('identifies the blog as a safe external link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /blog/i })).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
});

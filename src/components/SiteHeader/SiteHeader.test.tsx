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
    expect(screen.getByRole('link', { name: 'Index' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it.each([
    ['/projects', 'Projects'],
    ['/about', 'About'],
    ['/notes/card:test:1', 'Index'],
  ])('marks %s as the %s navigation surface', (pathname, label) => {
    navigation.pathname = pathname;

    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  it('identifies Writing as a safe external link', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /Writing/i })).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
});

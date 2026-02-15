import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('Header Component', () => {
  it('renders branding and logs', () => {
    render(<Header />);
    expect(screen.getByText(/Ashley's System Notes/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /Choices/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Builds/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /Human/i })).toHaveAttribute('href', '/about');
  });

  it('applies active class to the current path', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/projects');

    render(<Header />);

    const buildsLink = screen.getByRole('link', { name: /Builds/i });
    expect(buildsLink.className).toContain('active');

    const choicesLink = screen.getByRole('link', { name: /Choices/i });
    expect(choicesLink.className).not.toContain('active');
  });

  it('applies active class to the Human link when on /about', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/about');

    render(<Header />);

    const humanLink = screen.getByRole('link', { name: /Human/i });
    expect(humanLink.className).toContain('active');
  });

  it('renders blog link', () => {
    render(<Header />);
    const blogLink = screen.getByTestId('blog-link');
    expect(blogLink).toBeInTheDocument();
    expect(blogLink).toHaveAttribute('href', 'https://dev.to/anchildress1');
    expect(blogLink).toHaveAttribute('target', '_blank');
  });

  it('renders skip link', () => {
    render(<Header />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});

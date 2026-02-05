import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header';

describe('Header Component', () => {
  it('renders branding and logs', () => {
    render(<Header />);
    expect(screen.getByText(/Ashley's System Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/A living map of software systems/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /Projects/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /Fact Index/i })).toHaveAttribute('href', '/search');
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

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders copyright and author info', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    expect(screen.getByText(/Ashley Childress/)).toBeInTheDocument();
  });

  it('renders social links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /Visit my GitHub profile/i })).toHaveAttribute(
      'href',
      'https://github.com/anchildress1'
    );
    expect(screen.getByRole('link', { name: /Visit my LinkedIn profile/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/anchildress1'
    );
    expect(screen.getByRole('link', { name: /Visit my Dev.to profile/i })).toHaveAttribute(
      'href',
      'https://dev.to/anchildress1'
    );
  });

  it('renders sitemap link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /Sitemap/i })).toHaveAttribute('href', '/sitemap');
  });

  it('renders build info', () => {
    render(<Footer />);
    expect(screen.getByText(/Built with Gemini 3 Pro/i)).toBeInTheDocument();
  });
});

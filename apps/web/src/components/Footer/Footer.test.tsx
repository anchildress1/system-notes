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

  it('renders build info', () => {
    render(<Footer />);
    expect(
      screen.getByText(/Built with GitHub Copilot, ChatGPT, Verdent \+ Gemini/i)
    ).toBeInTheDocument();
  });

  it('renders Algolia attribution', () => {
    render(<Footer />);
    const algoliaLink = screen.getByRole('link', { name: /Powered by Algolia/i });
    expect(algoliaLink).toHaveAttribute('href', 'https://www.algolia.com');
    expect(screen.getByText(/Algolia/i)).toBeInTheDocument();
  });
});

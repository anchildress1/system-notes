import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { expectSurfaceLinks } from '@/test-utils/navigation';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders copyright and author info', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    expect(screen.getByText(/Ashley Childress/)).toBeInTheDocument();
    expect(screen.queryByText(/Built with GitHub Copilot/i)).not.toBeInTheDocument();
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

  it('renders nav surface links', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeVisible();
    expectSurfaceLinks(footer);
  });

  it('renders Algolia attribution', () => {
    render(<Footer />);
    const algoliaLink = screen.getByText('Algolia').closest('a');
    expect(algoliaLink).toHaveAttribute('href', 'https://www.algolia.com');
    expect(screen.getByText('Powered by')).toBeInTheDocument();
  });

  it('renders build version tagline', () => {
    render(<Footer />);
    expect(screen.getByText(/build \/ break \/ ship/i)).toBeInTheDocument();
  });
});

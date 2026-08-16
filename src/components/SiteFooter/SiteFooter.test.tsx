import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SiteFooter from './SiteFooter';

describe('SiteFooter', () => {
  it('renders the site statement and safe external profile links', () => {
    render(<SiteFooter />);

    expect(screen.getByText(/systems, software, and the proof/i)).toBeInTheDocument();
    const github = screen.getByRole('link', { name: /GitHub/i });
    expect(github).toHaveAttribute('href', 'https://github.com/anchildress1');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});

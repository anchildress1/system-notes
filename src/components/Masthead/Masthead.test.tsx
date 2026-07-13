import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Masthead from './Masthead';

describe('Masthead', () => {
  it('renders concise ticker copy twice for the seamless loop', () => {
    render(<Masthead />);

    expect(screen.getAllByText('SEARCHABLE PORTFOLIO')).toHaveLength(2);
    expect(screen.getAllByText('DECISION LOGS')).toHaveLength(2);
    expect(screen.getAllByText('LESS VIBES, MORE PROOF')).toHaveLength(2);
  });

  it('keeps decorative ticker text out of the accessibility tree', () => {
    const { container } = render(<Masthead />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

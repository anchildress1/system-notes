import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusPill from './StatusPill';

describe('StatusPill', () => {
  it('renders the label with a dot by default', () => {
    const { container } = render(<StatusPill>SYS · /sys/choices</StatusPill>);
    expect(screen.getByText(/SYS/)).toBeInTheDocument();
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('can hide the dot', () => {
    const { container } = render(<StatusPill dot={false}>v2.1.26</StatusPill>);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});

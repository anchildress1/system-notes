import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Kicker from './Kicker';

describe('Kicker', () => {
  it('renders teal tone with a dot by default', () => {
    const { container } = render(<Kicker>CWD · /sys/choices</Kicker>);
    const el = screen.getByText(/CWD/);
    expect(el).toHaveAttribute('data-tone', 'teal');
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('omits the dot for the dim section tone', () => {
    const { container } = render(<Kicker tone="dim">{'// featured'}</Kicker>);
    expect(screen.getByText('// featured')).toHaveAttribute('data-tone', 'dim');
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('supports accent tone with a hue', () => {
    render(
      <Kicker tone="accent" accent="pink">
        01 · NODE
      </Kicker>
    );
    const el = screen.getByText('01 · NODE');
    expect(el).toHaveAttribute('data-tone', 'accent');
    expect(el).toHaveAttribute('data-accent', 'pink');
  });

  it('can force the dot on for non-teal tones', () => {
    const { container } = render(
      <Kicker tone="dim" dot>
        forced
      </Kicker>
    );
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });
});

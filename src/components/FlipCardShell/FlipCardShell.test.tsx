import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import cardStyles from '@/styles/card.module.css';
import FlipCardShell from './FlipCardShell';

const renderShell = (isFlipped: boolean, featured = false) =>
  render(
    <FlipCardShell
      accent="violet"
      cardClassName="card"
      className="root"
      featured={featured}
      flipperClassName="flipper"
      front={<span>front</span>}
      frontClassName="front"
      isFlipped={isFlipped}
      size={featured ? 'wide' : undefined}
      testId="shell"
    >
      <span>back</span>
    </FlipCardShell>
  );

describe('FlipCardShell', () => {
  it('renders the standard collapsed shell and both faces', () => {
    renderShell(false);

    const shell = screen.getByTestId('shell');
    expect(shell).toHaveAttribute('data-accent', 'violet');
    expect(shell).not.toHaveAttribute('data-size');
    expect(shell.firstElementChild).toHaveAttribute('data-state', 'collapsed');
    expect(screen.getByText('front').parentElement).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('front').parentElement).toHaveClass(cardStyles.seam);
    expect(screen.getByText('back')).toBeInTheDocument();
  });

  it('renders the featured expanded state', () => {
    renderShell(true, true);

    const shell = screen.getByTestId('shell');
    expect(shell).toHaveAttribute('data-size', 'wide');
    expect(shell.firstElementChild).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByText('front').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('front').parentElement).toHaveClass(cardStyles.winnerBanner);
  });
});

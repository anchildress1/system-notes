import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import Button from './Button';

describe('Button', () => {
  it('renders a <button> by default with variant/size/accent data attributes', () => {
    render(<Button>Deploy</Button>);
    const btn = screen.getByRole('button', { name: 'Deploy' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('data-variant', 'secondary');
    expect(btn).toHaveAttribute('data-size', 'md');
    expect(btn).toHaveAttribute('data-accent', 'violet');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('honors explicit size and accent on the standard CTA', () => {
    render(
      <Button size="lg" accent="teal">
        Ship
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Ship' });
    expect(btn).toHaveAttribute('data-variant', 'secondary');
    expect(btn).toHaveAttribute('data-size', 'lg');
    expect(btn).toHaveAttribute('data-accent', 'teal');
  });

  it('forwards expanded and state attributes for controlled utility buttons', () => {
    render(
      <Button variant="fab" ariaExpanded dataState="open">
        Chat
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Chat' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(btn).toHaveAttribute('data-state', 'open');
  });

  it('forwards raw aria/data attributes and refs for composed controls', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button
        ref={ref}
        aria-label="Close panel"
        aria-current="page"
        aria-pressed
        data-state="active"
      >
        ×
      </Button>
    );

    const btn = screen.getByRole('button', { name: 'Close panel' });
    expect(ref.current).toBe(btn);
    expect(btn).toHaveAttribute('aria-current', 'page');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('data-state', 'active');
  });

  it('renders an <a> with rel for external targets when href is set', () => {
    render(
      <Button href="https://dev.to/anchildress1" target="_blank" dataTestId="blog-link">
        $ read --blog
      </Button>
    );
    const link = screen.getByTestId('blog-link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://dev.to/anchildress1');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('omits rel for non-blank links', () => {
    render(
      <Button href="/projects" dataTestId="internal">
        Builds
      </Button>
    );
    expect(screen.getByTestId('internal')).not.toHaveAttribute('rel');
  });

  it('renders a <button> (not <a>) when disabled even with href', () => {
    render(
      <Button href="/x" disabled dataTestId="dead">
        Nope
      </Button>
    );
    const el = screen.getByTestId('dead');
    expect(el.tagName).toBe('BUTTON');
    expect(el).toBeDisabled();
  });

  it('fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Tap' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders left and right icons plus aria-label', () => {
    render(
      <Button
        ariaLabel="play"
        icon={<span data-testid="ico-l">L</span>}
        iconRight={<span data-testid="ico-r">R</span>}
      >
        Go
      </Button>
    );
    expect(screen.getByTestId('ico-l')).toBeInTheDocument();
    expect(screen.getByTestId('ico-r')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'play' })).toBeInTheDocument();
  });
});

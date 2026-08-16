import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hero from './Hero';

const defaultProps = {
  title: 'Test Title',
  subtitle: 'Test Subtitle',
};

function findGlitterEvent(
  calls: Parameters<typeof globalThis.dispatchEvent>[]
): CustomEvent<{ x?: number; y?: number }> | undefined {
  return calls.find(([event]) => event.type === 'trigger-glitter-bomb')?.[0] as
    | CustomEvent<{ x?: number; y?: number }>
    | undefined;
}

async function pressHeroKey(key: string) {
  const user = userEvent.setup();
  render(<Hero {...defaultProps} />);

  const container = screen.getByTestId('hero-interactive');
  container.focus();
  await user.keyboard(key);
}

describe('Hero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the title and subtitle', () => {
    render(<Hero {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders correctly without a subtitle', () => {
    render(<Hero title="Only Title" />);
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('renders the aside (split layout) when provided', () => {
    render(<Hero {...defaultProps} aside={<div data-testid="hero-aside">portrait</div>} />);
    expect(screen.getByTestId('hero-aside')).toBeInTheDocument();
  });

  it('renders the kicker when provided', () => {
    render(<Hero {...defaultProps} kicker="// SURFACE STACK" />);
    expect(screen.getByText('// SURFACE STACK')).toBeInTheDocument();
  });

  it('renders the actions slot when provided', () => {
    render(<Hero {...defaultProps} actions={<button data-testid="hero-cta">go</button>} />);
    expect(screen.getByTestId('hero-cta')).toBeInTheDocument();
  });

  it('keeps split hero title text as one accessible heading', () => {
    render(
      <Hero title="Designing for the failures" titleAccent="you have not met" accentWord="yet" />
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Designing for the failures you have not met\s+yet/i,
      })
    ).toBeInTheDocument();
  });

  it('supports accent lead text without rewriting the title copy', () => {
    render(<Hero accentLead="Designing" title="for the failures you have not met yet." />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Designing for the failures you have not met yet.',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Designing').className).toContain('rotatingWord');
  });

  it('can scope the accent tone for page-specific hero art direction', () => {
    render(
      <Hero {...defaultProps} titleAccent="Retrieve" accentWord="evidence" accentTone="teal" />
    );
    expect(screen.getByText('evidence').closest('[data-accent-tone]')).toHaveAttribute(
      'data-accent-tone',
      'teal'
    );
  });

  it('dispatches trigger-glitter-bomb event on click', () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const container = screen.getByTestId('hero-interactive');
    fireEvent.click(container, { clientX: 120, clientY: 240 });

    expect(findGlitterEvent(dispatchSpy.mock.calls)?.detail).toEqual({ x: 120, y: 240 });
  });

  // jsdom cannot measure the hit area, so the DOM relationship is the regression boundary.
  it('mounts the trigger on the hero itself, not inside the text column', () => {
    const { container } = render(<Hero {...defaultProps} subtitle="Sub" />);
    const trigger = screen.getByTestId('hero-interactive');
    const hero = container.querySelector('[data-accent-tone]');

    expect(trigger.parentElement).toBe(hero);
    expect(trigger.closest('h1')).toBeNull();
    expect(screen.getByText('Sub').contains(trigger)).toBe(false);
  });

  it.each([
    { key: '{Enter}', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])('dispatches trigger-glitter-bomb event on $label key', async ({ key }) => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    await pressHeroKey(key);

    expect(findGlitterEvent(dispatchSpy.mock.calls)?.detail).toBeNull();
  });

  it('does not dispatch on other keys', async () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    await pressHeroKey('{Escape}');

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

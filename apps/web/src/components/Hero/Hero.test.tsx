import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from './Hero';

// Mock useSparkles hook
vi.mock('@/hooks/useSparkles', () => ({
  useSparkles: vi.fn(),
}));

describe('Hero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
  };

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

  it('can scope the accent tone for page-specific hero art direction', () => {
    render(<Hero {...defaultProps} accentLead="Designing" accentTone="teal" />);
    expect(screen.getByText('Designing').closest('[data-accent-tone]')).toHaveAttribute(
      'data-accent-tone',
      'teal'
    );
  });

  it('dispatches trigger-glitter-bomb event on click', () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const container = screen.getByTestId('hero-interactive');
    fireEvent.click(container);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls.find(
      (call) => (call[0] as Event).type === 'trigger-glitter-bomb'
    );
    expect(event).toBeTruthy();
    dispatchSpy.mockRestore();
  });

  it.each([
    { key: 'Enter', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])('dispatches trigger-glitter-bomb event on $label key', ({ key }) => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const container = screen.getByTestId('hero-interactive');
    fireEvent.keyDown(container, { key });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('does not dispatch on other keys', () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const container = screen.getByTestId('hero-interactive');
    fireEvent.keyDown(container, { key: 'Escape' });

    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});

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
    render(<Hero {...defaultProps} kicker="CWD · /sys/test" />);
    expect(screen.getByText('CWD · /sys/test')).toBeInTheDocument();
  });

  it('renders the actions slot when provided', () => {
    render(<Hero {...defaultProps} actions={<button data-testid="hero-cta">go</button>} />);
    expect(screen.getByTestId('hero-cta')).toBeInTheDocument();
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

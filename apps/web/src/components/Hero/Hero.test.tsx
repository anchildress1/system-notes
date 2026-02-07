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

  it('renders an image when provided', () => {
    const imageProps = {
      src: '/test-image.jpg',
      alt: 'Test Image Alt',
      width: 100,
      height: 100,
    };
    render(<Hero {...defaultProps} image={imageProps} />);
    const img = screen.getByAltText('Test Image Alt');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('dispatches trigger-glitter-bomb event on click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.click(button);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls.find(
      (call) => (call[0] as Event).type === 'trigger-glitter-bomb'
    );
    expect(event).toBeTruthy();
    dispatchSpy.mockRestore();
  });

  it('dispatches trigger-glitter-bomb event on Enter key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('dispatches trigger-glitter-bomb event on Space key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.keyDown(button, { key: ' ' });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('does not dispatch on other keys', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.keyDown(button, { key: 'Escape' });

    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});

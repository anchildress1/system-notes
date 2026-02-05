import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FactsHero from './FactsHero';

vi.mock('@/hooks/useSparkles', () => ({
  useSparkles: vi.fn(),
}));

describe('FactsHero', () => {
  it('renders the title and subtitle', () => {
    render(<FactsHero />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fact Index');
    expect(screen.getByText(/Indexed insights from the engineering trenches/i)).toBeInTheDocument();
  });

  it('has accessible interactive container', () => {
    render(<FactsHero />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Click to trigger a glitter effect');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('dispatches glitter event on click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<FactsHero />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('trigger-glitter-bomb');
    dispatchSpy.mockRestore();
  });

  it('dispatches glitter event on Enter key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<FactsHero />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('dispatches glitter event on Space key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<FactsHero />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});

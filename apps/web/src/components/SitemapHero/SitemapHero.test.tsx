import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import SitemapHero from './SitemapHero';

// Mock Sparkles hook and PIXI
vi.mock('@/hooks/useSparkles', () => ({
  useSparkles: vi.fn(),
}));

describe('SitemapHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Desktop env default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders correctly', () => {
    render(<SitemapHero />);
    expect(screen.getByRole('heading', { name: /AI wanted this here/i })).toBeInTheDocument();
    expect(screen.getByText(/I didn't argue/i)).toBeInTheDocument();
  });

  it('triggers glitter bomb on click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<SitemapHero />);
    const trigger = screen.getByRole('button', { name: /Click to trigger/i });

    fireEvent.click(trigger);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect((dispatchSpy.mock.calls[0][0] as Event).type).toBe('trigger-glitter-bomb');
  });

  it('triggers glitter bomb and prevents default on Enter/Space', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<SitemapHero />);
    const trigger = screen.getByRole('button', { name: /Click to trigger/i });

    // Enter key
    const enterEvent = createEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent(trigger, enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect((dispatchSpy.mock.calls[0][0] as Event).type).toBe('trigger-glitter-bomb');

    // Space key
    const spaceEvent = createEvent.keyDown(trigger, { key: ' ' });
    fireEvent(trigger, spaceEvent);

    expect(spaceEvent.defaultPrevented).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledTimes(2); // +1 from before
  });

  it('ignores other keys', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<SitemapHero />);
    const trigger = screen.getByRole('button', { name: /Click to trigger/i });

    // A key
    const aEvent = { key: 'a', preventDefault: vi.fn() };
    fireEvent.keyDown(trigger, aEvent);

    expect(aEvent.preventDefault).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

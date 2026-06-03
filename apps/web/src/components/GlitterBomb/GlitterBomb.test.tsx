import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import GlitterBomb from './GlitterBomb';

const sparkleCount = () => document.querySelectorAll('.sparkle').length;

describe('GlitterBomb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no Web Animations API — stub animate so spawnSparkles can run.
    Element.prototype.animate = vi.fn() as unknown as typeof Element.prototype.animate;
    // Motion allowed by default.
    globalThis.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll('.sparkle').forEach((el) => el.remove());
  });

  it('spawns a sparkle burst on trigger and clears it after the animation', () => {
    render(<GlitterBomb />);

    act(() => {
      globalThis.dispatchEvent(
        new CustomEvent('trigger-glitter-bomb', { detail: { x: 120, y: 240 } })
      );
    });
    expect(sparkleCount()).toBe(18);

    // Each sparkle removes itself after 1400ms.
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(sparkleCount()).toBe(0);
  });

  it('falls back to screen center when the event carries no coordinates', () => {
    render(<GlitterBomb />);

    act(() => {
      globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
    });
    expect(sparkleCount()).toBe(18);
  });

  it('spawns nothing when the user prefers reduced motion', () => {
    globalThis.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true }) as unknown as typeof matchMedia;
    render(<GlitterBomb />);

    act(() => {
      globalThis.dispatchEvent(
        new CustomEvent('trigger-glitter-bomb', { detail: { x: 10, y: 10 } })
      );
    });
    expect(sparkleCount()).toBe(0);
  });

  it('removes its listener on unmount', () => {
    const { unmount } = render(<GlitterBomb />);
    unmount();

    act(() => {
      globalThis.dispatchEvent(
        new CustomEvent('trigger-glitter-bomb', { detail: { x: 50, y: 50 } })
      );
    });
    expect(sparkleCount()).toBe(0);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import GlitterBomb from './GlitterBomb';

const sparkleCount = () => document.querySelectorAll('.sparkle').length;

describe('GlitterBomb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no Web Animations API — stub animate so spawnSparkles can run.
    Element.prototype.animate = vi.fn() as unknown as typeof Element.prototype.animate;
    globalThis.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
    expect(sparkleCount()).toBe(24);

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(sparkleCount()).toBe(0);
  });

  it('falls back to horizontal center and one-third viewport height', () => {
    vi.stubGlobal('innerWidth', 1200);
    vi.stubGlobal('innerHeight', 900);
    render(<GlitterBomb />);

    act(() => {
      globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
    });

    const firstSparkle = document.querySelector<HTMLElement>('.sparkle');
    expect(sparkleCount()).toBe(24);
    expect(firstSparkle).toHaveStyle({ left: '600px', top: '300px' });
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

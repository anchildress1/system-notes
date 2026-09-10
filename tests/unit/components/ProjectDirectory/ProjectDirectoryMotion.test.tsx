import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectDirectoryMotion } from '@/components/ProjectDirectory/ProjectDirectoryMotion';

type FakeAnimation = { cancel: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> } & {
  currentTime: number;
};

const animations: FakeAnimation[] = [];
const frames: FrameRequestCallback[] = [];
const listeners = new Set<() => void>();

/** Run whatever requestAnimationFrame has queued, as a real frame would. */
function flushFrames() {
  const queued = frames.splice(0);
  queued.forEach((cb) => cb(0));
}

/** jsdom has none of the scroll-timeline surface, so every branch needs a stub. */
function stubEnvironment({ supportsTimeline = false, prefersMotion = true } = {}) {
  animations.length = 0;
  listeners.clear();

  vi.stubGlobal('CSS', { supports: () => supportsTimeline });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefersMotion && query.includes('no-preference'),
    addEventListener: (_: string, handler: () => void) => listeners.add(handler),
    removeEventListener: (_: string, handler: () => void) => listeners.delete(handler),
  }));
  // Deferred, like the real thing. A synchronous stub runs the callback before
  // `frame = requestAnimationFrame(...)` assigns, so `frame` never returns to
  // undefined and every scroll after the first is silently dropped.
  frames.length = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('innerHeight', 800);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    }
  );

  Element.prototype.animate = vi.fn(() => {
    const animation = { cancel: vi.fn(), pause: vi.fn(), currentTime: 0 } as FakeAnimation;
    animations.push(animation);
    return animation as unknown as Animation;
  }) as unknown as typeof Element.prototype.animate;
}

// --cover-range stands in for the stylesheet, which jsdom does not apply. The
// component treats a part without one as not a part at all.
function renderParts(extra?: React.ReactNode) {
  return render(
    <ProjectDirectoryMotion className="catalogue">
      <div data-motion-part="copy" style={{ '--cover-range': '32%' } as React.CSSProperties} />
      <div
        data-motion-part="media"
        style={
          {
            '--cover-range': '36%',
            '--tape-before-start-turn': '58deg',
            '--tape-after-start-turn': '-58deg',
          } as React.CSSProperties
        }
      />
      <div
        data-motion-part="references"
        style={{ '--cover-range': '24%' } as React.CSSProperties}
      />
      {extra}
    </ProjectDirectoryMotion>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ProjectDirectoryMotion', () => {
  it('renders the catalogue region whatever the browser supports', () => {
    stubEnvironment({ supportsTimeline: true });
    renderParts();

    expect(screen.getByRole('region', { name: 'Selected exhibits' })).toHaveClass('catalogue');
  });

  it('stays out of the way where the browser drives the timeline itself', () => {
    stubEnvironment({ supportsTimeline: true });
    renderParts();

    expect(screen.getByRole('region')).not.toHaveAttribute('data-motion-fallback');
    expect(animations).toHaveLength(0);
  });

  it('drives one paused animation per part where it does not', () => {
    stubEnvironment();
    renderParts();

    expect(screen.getByRole('region')).toHaveAttribute('data-motion-fallback', 'true');
    expect(animations).toHaveLength(3);
    animations.forEach((animation) => expect(animation.pause).toHaveBeenCalled());
  });

  it('captures the entry transform from the active fallback stylesheet', () => {
    stubEnvironment();
    const stylesheet = document.createElement('style');
    stylesheet.textContent = `
      .catalogue [data-motion-part] { --cover-range: 32%; }
      .catalogue[data-motion-fallback='true'] [data-motion-part] {
        scale: 0.9;
        translate: 40px 20px;
      }
    `;
    document.head.append(stylesheet);

    try {
      render(
        <ProjectDirectoryMotion className="catalogue">
          <div data-motion-part="copy" />
        </ProjectDirectoryMotion>
      );

      expect(Element.prototype.animate).toHaveBeenCalledWith(
        [
          { scale: '0.9', translate: '40px 20px' },
          { scale: '1', translate: '0px' },
        ],
        expect.objectContaining({ fill: 'both' })
      );
      expect(animations).toHaveLength(1);
      expect(animations[0].pause).toHaveBeenCalled();
    } finally {
      stylesheet.remove();
    }
  });

  it('animates nothing when reduced motion is asked for', () => {
    stubEnvironment({ prefersMotion: false });
    renderParts();

    expect(screen.getByRole('region')).not.toHaveAttribute('data-motion-fallback');
    expect(animations).toHaveLength(0);
  });

  it('skips a part the stylesheet gives no range', () => {
    stubEnvironment();
    const caption = <div data-motion-part="caption" data-testid="caption" />;
    renderParts(caption);

    // Four parts in the markup, three with a range. Scrubbing the fourth would
    // set currentTime to NaN, which throws and strands every part after it.
    expect(animations).toHaveLength(3);
    window.dispatchEvent(new Event('scroll'));
    expect(flushFrames).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'ProjectDirectoryMotion: --cover-range missing or invalid.',
      expect.objectContaining({ element: screen.getByTestId('caption') })
    );
  });

  it('leaves the catalogue unmarked when every part is skipped', () => {
    stubEnvironment();
    render(
      <ProjectDirectoryMotion className="catalogue">
        <div data-motion-part="caption" />
      </ProjectDirectoryMotion>
    );

    expect(animations).toHaveLength(0);
    expect(screen.getByRole('region')).not.toHaveAttribute('data-motion-fallback');
  });

  it('logs and stays static when the Web Animations API is unavailable', () => {
    stubEnvironment();
    Reflect.deleteProperty(Element.prototype, 'animate');
    renderParts();

    expect(screen.getByRole('region')).not.toHaveAttribute('data-motion-fallback');
    expect(animations).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
      'ProjectDirectoryMotion: Web Animations API unavailable; scroll motion cannot run.'
    );
  });

  it('does not throw or move an animation when the viewport has zero height', () => {
    stubEnvironment();
    renderParts();
    animations.forEach((animation) => {
      animation.currentTime = 0;
    });

    vi.stubGlobal('innerHeight', 0);
    window.dispatchEvent(new Event('scroll'));

    expect(flushFrames).not.toThrow();
    animations.forEach((animation) => expect(animation.currentTime).toBe(0));
  });

  it('scrubs on every scroll, not just the first', () => {
    stubEnvironment();
    renderParts();
    animations.forEach((animation) => {
      animation.currentTime = 0;
    });

    window.dispatchEvent(new Event('scroll'));
    flushFrames();
    // jsdom reports a zero-height box at the top of a 800px viewport, so every
    // part reads as fully arrived.
    animations.forEach((animation) => expect(animation.currentTime).toBeGreaterThan(0));

    // The second one proves the frame handle was released. A stub that ran the
    // callback synchronously left it set and dropped everything after the first.
    animations.forEach((animation) => {
      animation.currentTime = 0;
    });
    window.dispatchEvent(new Event('scroll'));
    flushFrames();
    animations.forEach((animation) => expect(animation.currentTime).toBeGreaterThan(0));
  });

  it('uses layout geometry so repeated scrolls and reversals reach the same pose', () => {
    stubEnvironment();
    renderParts();
    const catalogue = screen.getByRole('region');
    const media = catalogue.querySelector<HTMLElement>('[data-motion-part="media"]')!;
    const animation = animations[1];
    vi.spyOn(media, 'offsetHeight', 'get').mockReturnValue(200);
    vi.spyOn(media, 'offsetTop', 'get').mockReturnValue(100);
    vi.spyOn(media, 'offsetParent', 'get').mockReturnValue(catalogue);
    vi.spyOn(catalogue, 'offsetTop', 'get').mockReturnValue(996);
    vi.spyOn(catalogue, 'clientTop', 'get').mockReturnValue(4);
    vi.spyOn(media, 'getBoundingClientRect').mockImplementation(() => {
      const progress = animation.currentTime / 1000;
      return {
        top: 1100 - window.scrollY + 32 * (1 - progress),
        height: 200 * (0.94 + 0.06 * progress),
      } as DOMRect;
    });
    animation.currentTime = 0;

    for (const scrollY of [500, 500, 1000, 500]) {
      vi.stubGlobal('scrollY', scrollY);
      window.dispatchEvent(new Event('scroll'));
      flushFrames();

      expect(animation.currentTime).toBeCloseTo(scrollY === 1000 ? 1000 : 555.556, 2);
    }
  });

  it('presses each tape edge down at its own viewport position', () => {
    stubEnvironment();
    renderParts();
    const media = document.querySelector<HTMLElement>('[data-motion-part="media"]');
    if (!media) throw new Error('Expected media motion part');
    vi.spyOn(media, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      bottom: 820,
      height: 420,
    } as DOMRect);

    window.dispatchEvent(new Event('scroll'));
    flushFrames();

    expect(Number.parseFloat(media.style.getPropertyValue('--tape-before-turn'))).toBeGreaterThan(
      0
    );
    expect(Number.parseFloat(media.style.getPropertyValue('--tape-after-turn'))).toBeLessThan(0);

    vi.mocked(media.getBoundingClientRect).mockReturnValue({
      top: 80,
      bottom: 640,
      height: 360,
    } as DOMRect);
    window.dispatchEvent(new Event('scroll'));
    flushFrames();

    expect(media.style.getPropertyValue('--tape-before-turn')).toBe('0.000deg');
    expect(media.style.getPropertyValue('--tape-after-turn')).toBe('0.000deg');
  });

  it('cancels its animations and its media listener on unmount', () => {
    stubEnvironment();
    const { unmount } = renderParts();
    const created = [...animations];

    unmount();

    created.forEach((animation) => expect(animation.cancel).toHaveBeenCalled());
    expect(listeners.size).toBe(0);
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AboutPageMotion } from '@/components/AboutPageMotion/AboutPageMotion';

type FakeAnimation = {
  element: Element;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  currentTime: number;
};

type FakeObserver = {
  callback: ResizeObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const animations: FakeAnimation[] = [];
const observers: FakeObserver[] = [];
const frames = new Map<number, FrameRequestCallback>();
const mediaListeners = new Set<() => void>();
const environment = { nativeTimeline: false, motionEnabled: true };
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
let nextFrame = 0;

function flushFrames() {
  const queued = [...frames.values()];
  frames.clear();
  queued.forEach((callback) => callback(0));
}

function scrollToScene(top: number, id = 'first') {
  screen.getByTestId(`scene-${id}`).dataset.top = String(top);
  window.dispatchEvent(new Event('scroll'));
  flushFrames();
}

function changeMotionPreference(enabled: boolean) {
  environment.motionEnabled = enabled;
  mediaListeners.forEach((listener) => listener());
}

function notifyLayoutChange() {
  observers.forEach(({ callback }) => callback([], {} as ResizeObserver));
  flushFrames();
}

function Scene({
  id = 'first',
  top = 680,
  start = '0.85',
  end = '0.45',
  from = 'translateY(64px)',
}: {
  id?: string;
  top?: number;
  start?: string;
  end?: string;
  from?: string;
}) {
  return (
    <section data-about-scene data-testid={`scene-${id}`} data-top={top}>
      <h2>Evidence {id}</h2>
      <span
        data-about-motion
        data-testid={`target-${id}`}
        data-top="4000"
        style={
          {
            '--motion-start': start,
            '--motion-end': end,
            '--motion-from': from,
          } as CSSProperties
        }
      >
        Judgment stays human.
      </span>
    </section>
  );
}

function renderMotion(children: ReactNode = <Scene />) {
  return render(<AboutPageMotion className="about-page">{children}</AboutPageMotion>);
}

beforeEach(() => {
  animations.length = 0;
  observers.length = 0;
  frames.clear();
  mediaListeners.clear();
  nextFrame = 0;
  environment.nativeTimeline = false;
  environment.motionEnabled = true;

  vi.stubGlobal('CSS', { supports: vi.fn(() => environment.nativeTimeline) });
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      media: query,
      get matches() {
        return environment.motionEnabled;
      },
      addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
    }))
  );
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollY', 0);
  // Deliberately deferred, not synchronous: a synchronous stub would assign the
  // handle after its own callback already cleared it, making a broken
  // controller look like it still handles later scroll events.
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    })
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => frames.delete(id))
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();

      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, observe: this.observe, disconnect: this.disconnect });
      }
    }
  );

  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: vi.fn(function (this: Element) {
      const animation = {
        element: this,
        cancel: vi.fn(),
        pause: vi.fn(),
        currentTime: 0,
      };
      animations.push(animation);
      return animation as unknown as Animation;
    }),
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    const top = Number(this.dataset.top ?? '0');
    const height = Number(this.dataset.height ?? '100');
    return { top, bottom: top + height, height } as DOMRect;
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) {
    Object.defineProperty(Element.prototype, 'animate', originalAnimate);
  } else {
    Reflect.deleteProperty(Element.prototype, 'animate');
  }
});

describe('About portrait scroll motion', () => {
  let header: HTMLElement;

  beforeEach(() => {
    header = document.createElement('header');
    header.dataset.height = '80';
    document.body.prepend(header);
  });

  afterEach(() => {
    header.remove();
  });

  function renderPortrait() {
    return renderMotion(
      <figure
        data-about-tape
        data-testid="portrait"
        data-top="240"
        data-height="400"
        style={
          {
            '--tape-before-start-turn': '80deg',
            '--tape-after-start-turn': '-60deg',
          } as CSSProperties
        }
      />
    );
  }

  function scrollPortrait(scrollY: number) {
    vi.stubGlobal('scrollY', scrollY);
    screen.getByTestId('portrait').dataset.top = String(240 - scrollY);
    window.dispatchEvent(new Event('scroll'));
    flushFrames();
  }

  function turns() {
    const style = screen.getByTestId('portrait').style;
    return [
      Number.parseFloat(style.getPropertyValue('--tape-before-turn')),
      Number.parseFloat(style.getPropertyValue('--tape-after-turn')),
    ];
  }

  it.each([
    { nativeTimeline: true, webAnimations: true },
    { nativeTimeline: false, webAnimations: true },
    { nativeTimeline: false, webAnimations: false },
  ])(
    'folds each edge through exit and reentry with native=$nativeTimeline and WAAPI=$webAnimations',
    ({ nativeTimeline, webAnimations }) => {
      environment.nativeTimeline = nativeTimeline;
      if (!webAnimations) Reflect.deleteProperty(Element.prototype, 'animate');
      renderPortrait();

      expect(turns()).toEqual([0, 0]);
      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: no-preference) and (min-width: 55.01rem)'
      );
      expect(observers[0].observe).toHaveBeenCalledWith(header);

      scrollPortrait(80);
      const intermediate = turns();
      expect(intermediate[0]).toBeGreaterThan(0);
      expect(intermediate[0]).toBeLessThan(80);
      expect(intermediate[1]).toBeLessThan(0);
      expect(intermediate[1]).toBeGreaterThan(-60);
      expect(intermediate[0] / 80).toBeGreaterThan(Math.abs(intermediate[1]) / 60);

      scrollPortrait(160);
      expect(turns()[0]).toBe(80);
      expect(turns()[1]).toBeGreaterThan(-60);
      scrollPortrait(560);
      expect(turns()).toEqual([80, -60]);
      scrollPortrait(80);
      expect(turns()).toEqual(intermediate);
      scrollPortrait(0);
      expect(turns()).toEqual([0, 0]);
      expect(animations).toHaveLength(0);
    }
  );

  it('keeps reduced-motion or narrow viewports static and follows changes to that preference', () => {
    environment.nativeTimeline = true;
    environment.motionEnabled = false;
    renderPortrait();
    const portrait = screen.getByTestId('portrait');

    scrollPortrait(80);
    expect(portrait.style.getPropertyValue('--tape-before-turn')).toBe('');
    expect(portrait.style.getPropertyValue('--tape-after-turn')).toBe('');
    expect(frames.size).toBe(0);

    changeMotionPreference(true);
    expect(turns()[0]).toBeGreaterThan(0);
    expect(turns()[1]).toBeLessThan(0);
    changeMotionPreference(false);
    expect(portrait.style.getPropertyValue('--tape-before-turn')).toBe('');
    expect(portrait.style.getPropertyValue('--tape-after-turn')).toBe('');
  });
});

describe('AboutPageMotion', () => {
  it('preserves the main landmark and content when the browser owns motion', () => {
    environment.nativeTimeline = true;
    renderMotion();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveClass('about-page');
    expect(screen.getByRole('heading', { name: 'Evidence first' })).toBeVisible();
    expect(main).not.toHaveAttribute('data-motion-fallback');
    expect(animations).toHaveLength(0);
  });

  it('creates a paused animation for each target using its stylesheet range', () => {
    renderMotion(
      <>
        <Scene />
        <Scene id="second" start="0.9" end="0.3" from="translateX(32px)" />
      </>
    );

    expect(screen.getByRole('main')).toHaveAttribute('data-motion-fallback', 'true');
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: no-preference) and (min-width: 55.01rem)'
    );
    expect(animations.map(({ element }) => element)).toEqual([
      screen.getByTestId('target-first'),
      screen.getByTestId('target-second'),
    ]);
    expect(Element.prototype.animate).toHaveBeenNthCalledWith(
      1,
      [{ transform: 'translateY(64px)' }, { transform: 'none' }],
      { duration: 1000, easing: 'linear', fill: 'both' }
    );
    expect(Element.prototype.animate).toHaveBeenNthCalledWith(
      2,
      [{ transform: 'translateX(32px)' }, { transform: 'none' }],
      { duration: 1000, easing: 'linear', fill: 'both' }
    );
    animations.forEach(({ pause }) => expect(pause).toHaveBeenCalledOnce());
  });

  it('advances nested targets through independent ranges on their shared stationary source', () => {
    renderMotion(
      <section data-about-scene data-testid="scene-first" data-top="680">
        <div
          data-about-motion
          data-testid="count"
          data-top="4000"
          style={
            {
              '--motion-start': '0.85',
              '--motion-end': '0.45',
              '--motion-from': 'translateY(64px)',
            } as CSSProperties
          }
        >
          12
          <span
            data-about-motion
            data-testid="stroke"
            data-top="5000"
            style={
              {
                '--motion-start': '0.45',
                '--motion-end': '0.2',
                '--motion-from': 'scaleX(0)',
              } as CSSProperties
            }
          />
        </div>
      </section>
    );

    expect(animations.map(({ element }) => element)).toEqual([
      screen.getByTestId('count'),
      screen.getByTestId('stroke'),
    ]);
    expect(Element.prototype.animate).toHaveBeenNthCalledWith(
      2,
      [{ transform: 'scaleX(0)' }, { transform: 'none' }],
      { duration: 1000, easing: 'linear', fill: 'both' }
    );

    for (const [top, countTime, strokeTime] of [
      [680, 0, 0],
      [520, 500, 0],
      [360, 1000, 0],
      [260, 1000, 500],
      [160, 1000, 1000],
      [260, 1000, 500],
      [520, 500, 0],
    ]) {
      scrollToScene(top);
      expect(animations[0].currentTime).toBeCloseTo(countTime);
      expect(animations[1].currentTime).toBeCloseTo(strokeTime);
    }
    animations.forEach(({ pause }) => expect(pause).toHaveBeenCalledOnce());
  });

  it.each([
    { position: 'before entry', top: 900, time: 0 },
    { position: 'at entry', top: 680, time: 0 },
    { position: 'halfway through', top: 520, time: 500 },
    { position: 'at completion', top: 360, time: 1000 },
    { position: 'after completion', top: 100, time: 1000 },
  ])('sets the animation time $position without measuring its moving child', ({ top, time }) => {
    renderMotion(<Scene top={top} />);

    expect(animations[0].currentTime).toBeCloseTo(time);
    expect(animations[0].element).toBe(screen.getByTestId('target-first'));
  });

  it('scrubs through intermediate positions and reverses on later scrolls', () => {
    renderMotion();

    scrollToScene(600);
    expect(animations[0].currentTime).toBeCloseTo(250);
    scrollToScene(440);
    expect(animations[0].currentTime).toBeCloseTo(750);
    scrollToScene(600);
    expect(animations[0].currentTime).toBeCloseTo(250);
    expect(animations[0].pause).toHaveBeenCalledOnce();
  });

  it('coalesces scroll and resize events into one frame', () => {
    renderMotion();
    vi.mocked(window.requestAnimationFrame).mockClear();
    screen.getByTestId('scene-first').dataset.top = '520';

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    expect(window.requestAnimationFrame).toHaveBeenCalledOnce();
    expect(animations[0].currentTime).toBe(0);
    flushFrames();
    expect(animations[0].currentTime).toBeCloseTo(500);
  });

  it('recomputes viewport ratios after a window resize', () => {
    renderMotion(<Scene top={520} />);
    expect(animations[0].currentTime).toBeCloseTo(500);

    vi.stubGlobal('innerHeight', 1000);
    window.dispatchEvent(new Event('resize'));
    flushFrames();

    expect(animations[0].currentTime).toBeCloseTo(825);
  });

  it('does not throw or move the animation when the viewport has zero height', () => {
    renderMotion(<Scene top={520} />);
    expect(animations[0].currentTime).toBeCloseTo(500);

    vi.stubGlobal('innerHeight', 0);
    window.dispatchEvent(new Event('resize'));

    expect(flushFrames).not.toThrow();
    expect(animations[0].currentTime).toBeCloseTo(500);
  });

  it('observes layout sources and updates after layout changes without a scroll', () => {
    renderMotion();
    const source = screen.getByTestId('scene-first');

    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledWith(source);
    expect(observers[0].observe).not.toHaveBeenCalledWith(screen.getByTestId('target-first'));
    source.dataset.top = '520';
    notifyLayoutChange();

    expect(animations[0].currentTime).toBeCloseTo(500);
  });

  it.each([
    { label: 'missing start', start: '' },
    { label: 'missing end', end: '' },
    { label: 'nonnumeric start', start: 'entry' },
    { label: 'nonnumeric end', end: 'cover' },
    { label: 'infinite start', start: 'Infinity' },
    { label: 'infinite end', end: '-Infinity' },
    { label: 'equal boundaries', start: '0.5', end: '0.5' },
    { label: 'reversed boundaries', start: '0.25', end: '0.75' },
    { label: 'missing transform', from: '' },
  ])('skips $label without stranding a later valid scene', ({ label: _label, ...properties }) => {
    renderMotion(
      <>
        <Scene id="invalid" {...properties} />
        <Scene top={520} />
      </>
    );

    expect(animations).toHaveLength(1);
    expect(animations[0].element).toBe(screen.getByTestId('target-first'));
    expect(animations[0].currentTime).toBeCloseTo(500);
    expect(flushFrames).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'AboutPageMotion: --motion-start/--motion-end/--motion-from missing or invalid.',
      expect.objectContaining({ target: screen.getByTestId('target-invalid') })
    );
  });

  it('leaves content settled and logs when every target on the page is invalid', () => {
    renderMotion(<Scene start="" />);

    expect(screen.getByRole('main')).not.toHaveAttribute('data-motion-fallback');
    expect(animations).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
      'AboutPageMotion: --motion-start/--motion-end/--motion-from missing or invalid.',
      expect.any(Object)
    );
  });

  it('ignores sources without targets and targets without a source', () => {
    renderMotion(
      <>
        <section data-about-scene>
          <h2>A stationary section</h2>
        </section>
        <span data-about-motion>Outside a scene</span>
      </>
    );

    expect(screen.getByRole('heading', { name: 'A stationary section' })).toBeVisible();
    expect(animations).toHaveLength(0);
    window.dispatchEvent(new Event('scroll'));
    expect(flushFrames).not.toThrow();
  });

  it('leaves content settled when desktop motion is disabled', () => {
    environment.motionEnabled = false;
    renderMotion();

    expect(screen.getByRole('main')).not.toHaveAttribute('data-motion-fallback');
    expect(screen.getByText('Judgment stays human.')).toBeVisible();
    expect(animations).toHaveLength(0);
  });

  it('leaves content settled and logs when the browser cannot create animations', () => {
    Reflect.deleteProperty(Element.prototype, 'animate');
    renderMotion();

    expect(screen.getByRole('main')).not.toHaveAttribute('data-motion-fallback');
    expect(screen.getByText('Judgment stays human.')).toBeVisible();
    expect(observers).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
      'AboutPageMotion: Web Animations API unavailable; scroll motion cannot run.'
    );
  });

  it('clears pending motion when the preference changes and resumes at the current position', () => {
    renderMotion();
    const first = animations[0];
    screen.getByTestId('scene-first').dataset.top = '520';
    window.dispatchEvent(new Event('scroll'));

    changeMotionPreference(false);

    expect(first.cancel).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    expect(screen.getByRole('main')).not.toHaveAttribute('data-motion-fallback');
    changeMotionPreference(true);

    expect(screen.getByRole('main')).toHaveAttribute('data-motion-fallback', 'true');
    expect(animations).toHaveLength(2);
    expect(animations[1].currentTime).toBeCloseTo(500);
    expect(animations[1].pause).toHaveBeenCalledOnce();
  });

  it.each(['scroll', 'preference'] as const)(
    'hands motion to a newly supported native timeline during a %s update',
    (trigger) => {
      renderMotion();
      const first = animations[0];
      environment.nativeTimeline = true;

      if (trigger === 'scroll') {
        window.dispatchEvent(new Event('scroll'));
        flushFrames();
      } else {
        changeMotionPreference(true);
      }

      expect(first.cancel).toHaveBeenCalledOnce();
      expect(screen.getByRole('main')).not.toHaveAttribute('data-motion-fallback');
      expect(animations).toHaveLength(1);
      expect(frames.size).toBe(0);
    }
  );

  it('cancels pending work and disconnects all listeners on unmount', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderMotion();
    const main = screen.getByRole('main');
    window.dispatchEvent(new Event('scroll'));

    unmount();

    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(main).not.toHaveAttribute('data-motion-fallback');
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(mediaListeners.size).toBe(0);
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function));

    vi.mocked(window.requestAnimationFrame).mockClear();
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});

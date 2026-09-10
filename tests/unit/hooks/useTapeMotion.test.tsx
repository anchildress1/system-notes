import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { useRef, type ComponentProps, type CSSProperties } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTapeMotion, type TapeMotionOptions } from '@/hooks/useTapeMotion';

const projectOptions: TapeMotionOptions = {
  selector: '[data-tape]',
  mediaQuery: '(prefers-reduced-motion: no-preference) and (min-width: 48.01rem)',
  before: { start: 0.58, end: 0.18 },
  after: { start: 1.05, end: 0.82 },
};

const portraitOptions: TapeMotionOptions = {
  selector: '[data-tape]',
  mediaQuery: '(prefers-reduced-motion: no-preference) and (min-width: 55.01rem)',
  exitAbove: '[data-tape-boundary]',
};

const frames = new Map<number, FrameRequestCallback>();
const listeners = new Set<() => void>();
const observers: {
  callback: ResizeObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];
let matches = true;
let nextFrame = 0;

function Harness({
  options = projectOptions,
  top = 464,
  bottom = 840,
  before = '58deg',
  after = '-58deg',
  boundaryBottom,
}: {
  options?: TapeMotionOptions;
  top?: number;
  bottom?: number;
  before?: string;
  after?: string;
  boundaryBottom?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  useTapeMotion(root, options);
  return (
    <>
      {boundaryBottom === undefined ? null : (
        <header data-tape-boundary data-testid="boundary" data-bottom={boundaryBottom} />
      )}
      <div ref={root} data-testid="root">
        <figure
          data-tape
          data-testid="tape"
          data-top={top}
          data-bottom={bottom}
          style={
            {
              '--tape-before-start-turn': before,
              '--tape-after-start-turn': after,
            } as CSSProperties
          }
        />
      </div>
    </>
  );
}

function renderPortrait(properties: Partial<ComponentProps<typeof Harness>> = {}) {
  return render(
    <Harness
      options={portraitOptions}
      top={200}
      bottom={600}
      before="64deg"
      after="-64deg"
      boundaryBottom={100}
      {...properties}
    />
  );
}

function turns() {
  const style = screen.getByTestId('tape').style;
  return [
    Number.parseFloat(style.getPropertyValue('--tape-before-turn')),
    Number.parseFloat(style.getPropertyValue('--tape-after-turn')),
  ];
}

function flushFrames() {
  const queued = [...frames.values()];
  frames.clear();
  queued.forEach((callback) => callback(0));
}

function scrollTo(offset: number) {
  vi.stubGlobal('scrollY', offset);
  window.dispatchEvent(new Event('scroll'));
  flushFrames();
}

function setMotion(enabled: boolean) {
  matches = enabled;
  listeners.forEach((listener) => listener());
}

beforeEach(() => {
  matches = true;
  nextFrame = 0;
  frames.clear();
  listeners.clear();
  observers.length = 0;
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }))
  );
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
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    const scroll = this.hasAttribute('data-tape-boundary') ? 0 : window.scrollY;
    const top = Number(this.dataset.top ?? 0) - scroll;
    const bottom = Number(this.dataset.bottom ?? 0) - scroll;
    return { top, bottom, height: bottom - top } as DOMRect;
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useTapeMotion', () => {
  it.each([
    { top: 600, bottom: 950, expected: [58, -58] },
    { top: 464, bottom: 840, expected: [58, -58] },
    { top: 304, bottom: 748, expected: [29, -29] },
    { top: 144, bottom: 656, expected: [0, 0] },
    { top: 80, bottom: 500, expected: [0, 0] },
  ])('preserves the project edge ranges at $top / $bottom', ({ top, bottom, expected }) => {
    render(<Harness top={top} bottom={bottom} />);

    expect(turns()).toEqual(expected);
    expect(window.matchMedia).toHaveBeenCalledWith(projectOptions.mediaQuery);
    expect(observers[0].observe).toHaveBeenCalledWith(screen.getByTestId('root'));
    expect(observers[0].observe).toHaveBeenCalledWith(screen.getByTestId('tape'));
  });

  it('scrubs independent edges and reverses after multiple scrolls', () => {
    render(<Harness />);

    scrollTo(92);
    expect(turns()[0]).toBeGreaterThan(29);
    expect(turns()[1]).toBe(-29);
    const intermediate = turns();
    scrollTo(320);
    expect(turns()).toEqual([0, 0]);
    scrollTo(92);
    expect(turns()).toEqual(intermediate);
    scrollTo(0);
    expect(turns()).toEqual([58, -58]);
  });

  it('recomputes the edge ranges after resize and coalesces queued updates', () => {
    render(<Harness top={380} bottom={935} />);
    expect(turns()).toEqual([48.109, -58]);
    vi.mocked(window.requestAnimationFrame).mockClear();

    vi.stubGlobal('innerHeight', 1000);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(window.requestAnimationFrame).toHaveBeenCalledOnce();
    flushFrames();
    expect(turns()).toEqual([29, -29]);
  });

  it('refreshes tape positions after an observed layout change', () => {
    render(<Harness top={304} bottom={748} />);
    expect(turns()).toEqual([29, -29]);

    screen.getByTestId('tape').dataset.top = '464';
    screen.getByTestId('tape').dataset.bottom = '840';
    observers[0].callback([], {} as ResizeObserver);
    flushFrames();

    expect(turns()).toEqual([58, -58]);
  });

  it.each([{ before: '' }, { after: '' }, { before: 'Infinity' }, { after: 'not-an-angle' }])(
    'leaves tape settled for invalid start turns %o',
    (properties) => {
      render(<Harness {...properties} />);

      expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');
      expect(screen.getByTestId('tape').style.getPropertyValue('--tape-after-turn')).toBe('');
      expect(observers).toHaveLength(0);
      window.dispatchEvent(new Event('scroll'));
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'useTapeMotion: --tape-before-start-turn/--tape-after-start-turn missing or invalid.',
        expect.objectContaining({ element: screen.getByTestId('tape') })
      );
    }
  );

  it('logs and stays settled when the caller supplies a degenerate before/after range', () => {
    render(<Harness options={{ ...projectOptions, before: { start: 0.5, end: 0.5 } }} />);

    expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');
    expect(observers).toHaveLength(0);
    window.dispatchEvent(new Event('scroll'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'useTapeMotion: before/after range is not finite or has start === end.',
      { before: { start: 0.5, end: 0.5 }, after: projectOptions.after }
    );
  });

  it('logs and stays settled when the caller supplies a non-finite before/after range', () => {
    render(<Harness options={{ ...projectOptions, after: { start: Number.NaN, end: 0.82 } }} />);

    expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');
    expect(console.error).toHaveBeenCalledWith(
      'useTapeMotion: before/after range is not finite or has start === end.',
      expect.any(Object)
    );
  });

  it('does not observe or schedule when motion is disabled or no tape matches', () => {
    matches = false;
    const { rerender } = render(<Harness />);
    expect(observers).toHaveLength(0);
    expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');

    setMotion(true);
    expect(turns()).toEqual([58, -58]);
    rerender(<Harness options={{ ...projectOptions, selector: '[data-absent]' }} />);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');
    window.dispatchEvent(new Event('scroll'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('useTapeMotion: selector matched no elements.', {
      selector: '[data-absent]',
    });
  });

  it.each([
    { mode: 'entry', options: projectOptions },
    { mode: 'exit', options: portraitOptions },
  ])(
    'clears pending $mode work on a media change and resumes at the current position',
    ({ options }) => {
      render(<Harness options={options} boundaryBottom={100} />);
      scrollTo(92);
      const intermediate = turns();
      window.dispatchEvent(new Event('scroll'));

      setMotion(false);
      expect(frames.size).toBe(0);
      expect(observers[0].disconnect).toHaveBeenCalledOnce();
      expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');
      expect(screen.getByTestId('tape').style.getPropertyValue('--tape-after-turn')).toBe('');
      setMotion(true);
      expect(turns()).toEqual(intermediate);
      expect(observers).toHaveLength(2);
    }
  );

  it('releases inline turns, observers, and listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Harness />);
    const tape = screen.getByTestId('tape');
    window.dispatchEvent(new Event('scroll'));

    unmount();

    expect(tape.style.getPropertyValue('--tape-before-turn')).toBe('');
    expect(tape.style.getPropertyValue('--tape-after-turn')).toBe('');
    expect(frames.size).toBe(0);
    expect(listeners.size).toBe(0);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    vi.mocked(window.requestAnimationFrame).mockClear();
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('does nothing when the caller has no mounted root', () => {
    renderHook(() => useTapeMotion({ current: null }, projectOptions));

    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
    expect(listeners.size).toBe(0);
  });
});

describe('portrait tape leaving the viewport', () => {
  it('starts flat, folds each edge across its own travel, and retraces the same scroll positions', () => {
    renderPortrait();

    expect(turns()).toEqual([0, 0]);
    expect(window.matchMedia).toHaveBeenCalledWith(portraitOptions.mediaQuery);
    expect(observers[0].observe).toHaveBeenCalledWith(screen.getByTestId('boundary'));

    scrollTo(50);
    const intermediate = turns();
    expect(intermediate[0]).toBe(32);
    expect(intermediate[1]).toBeLessThan(0);
    expect(intermediate[1]).toBeGreaterThan(-32);

    scrollTo(100);
    expect(turns()[0]).toBe(64);
    expect(turns()[1]).toBeLessThan(intermediate[1]);
    expect(turns()[1]).toBeGreaterThan(-64);
    scrollTo(500);
    expect(turns()).toEqual([64, -64]);
    scrollTo(750);
    expect(turns()).toEqual([64, -64]);
    scrollTo(50);
    expect(turns()).toEqual(intermediate);
    scrollTo(0);
    expect(turns()).toEqual([0, 0]);
    scrollTo(-20);
    expect(turns()).toEqual([0, 0]);
  });

  it('starts at the restored document position without waiting for another scroll event', () => {
    vi.stubGlobal('scrollY', 250);

    renderPortrait();

    expect(turns()).toEqual([64, -32]);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    scrollTo(0);
    expect(turns()).toEqual([0, 0]);
  });

  it('recomputes both exits when the sticky header changes height', () => {
    renderPortrait();
    scrollTo(50);
    const intermediate = turns();
    const boundary = screen.getByTestId('boundary');

    boundary.dataset.bottom = '150';
    observers[0].callback([], {} as ResizeObserver);
    flushFrames();

    expect(turns()[0]).toBe(64);
    expect(turns()[1]).toBeLessThan(intermediate[1]);
    expect(turns()[1]).toBeGreaterThan(-64);
    boundary.dataset.bottom = '100';
    observers[0].callback([], {} as ResizeObserver);
    flushFrames();
    expect(turns()).toEqual(intermediate);
  });

  it('uses the new resting edges after layout shifts while the document is scrolled', () => {
    renderPortrait();
    scrollTo(100);
    const beforeLayout = turns();
    const portrait = screen.getByTestId('tape');
    portrait.dataset.top = '300';
    portrait.dataset.bottom = '1100';

    observers[0].callback([], {} as ResizeObserver);
    flushFrames();

    expect(turns()[0]).toBe(32);
    expect(turns()[1]).toBeLessThan(0);
    expect(turns()[1]).toBeGreaterThan(beforeLayout[1]);
    const afterLayout = turns();
    vi.stubGlobal('innerHeight', 1200);
    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(turns()).toEqual(afterLayout);
    scrollTo(0);
    expect(turns()).toEqual([0, 0]);
  });

  it('uses the current scroll position when motion is enabled after scrolling while disabled', () => {
    matches = false;
    renderPortrait();
    scrollTo(250);

    expect(observers).toHaveLength(0);
    expect(frames.size).toBe(0);
    expect(screen.getByTestId('tape').style.getPropertyValue('--tape-before-turn')).toBe('');

    setMotion(true);

    expect(turns()).toEqual([64, -32]);
    expect(observers[0].observe).toHaveBeenCalledWith(screen.getByTestId('boundary'));
  });

  it('folds against the viewport top when the requested header is absent', () => {
    renderPortrait({ boundaryBottom: undefined });

    expect(turns()).toEqual([0, 0]);
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      'useTapeMotion: exitAbove selector matched no element; folding against 0.',
      { exitAbove: portraitOptions.exitAbove }
    );
    scrollTo(100);
    expect(turns()[0]).toBe(32);
    expect(turns()[1]).toBeLessThan(0);
    expect(turns()[1]).toBeGreaterThan(-32);
    scrollTo(600);
    expect(turns()).toEqual([64, -64]);
  });

  it.each([
    { top: 100, bottom: 600, expected: [64, 0] },
    { top: 100, bottom: 100, expected: [64, -64] },
    { top: 80, bottom: 90, expected: [64, -64] },
  ])(
    'keeps finite folded turns for edges already hidden at $top / $bottom',
    ({ top, bottom, expected }) => {
      renderPortrait({ top, bottom });

      expect(turns()).toEqual(expected);
      expect(turns().every(Number.isFinite)).toBe(true);
      scrollTo(600);
      expect(turns()).toEqual([64, -64]);
    }
  );
});

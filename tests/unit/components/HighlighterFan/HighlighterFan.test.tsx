import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HighlighterFan from '@/components/HighlighterFan/HighlighterFan';
import { PEN_STORAGE_KEY } from '@/lib/pen';

const pen = (name: string) => screen.getByRole('button', { name: `${name} highlighter` });
const root = document.documentElement;

function preferences({ hover = true, reducedMotion = false } = {}) {
  vi.mocked(matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches:
          (query === '(hover: hover)' && hover) ||
          (query === '(prefers-reduced-motion: reduce)' && reducedMotion),
        media: query,
      }) as MediaQueryList
  );
}

const nativeMatches = Element.prototype.matches;
function focusVisible(visible: boolean) {
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    return selector === ':focus-visible' ? visible : nativeMatches.call(this, selector);
  });
}

function states() {
  return Object.fromEntries(
    ['Yellow', 'Blue', 'Green', 'Pink'].map((name) => [name, pen(name).dataset.state])
  );
}

describe('HighlighterFan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) =>
      window.setTimeout(() => callback(performance.now()), 16)
    );
    delete root.dataset.pen;
    delete root.dataset.penPhase;
    localStorage.clear();
    preferences();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('names every pen inside a labelled group, with yellow chosen by default', () => {
    render(<HighlighterFan />);

    expect(screen.getByRole('group', { name: 'Highlighter colour' })).toBeInTheDocument();
    expect(pen('Yellow')).toHaveAttribute('aria-pressed', 'true');
    for (const name of ['Blue', 'Green', 'Pink']) {
      expect(pen(name)).toHaveAttribute('aria-pressed', 'false');
    }
    expect(states()).toEqual({ Yellow: 'rest', Blue: 'hide', Green: 'hide', Pink: 'hide' });
  });

  it('reports the pen the head script already stamped', () => {
    root.dataset.pen = 'green';

    render(<HighlighterFan />);

    expect(pen('Green')).toHaveAttribute('aria-pressed', 'true');
    expect(pen('Green')).toHaveAttribute('data-slot', '3');
  });

  it('lifts the old ink, swaps the pen, then draws the new one', () => {
    render(<HighlighterFan />);

    fireEvent.click(pen('Blue'));

    expect(pen('Blue')).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(PEN_STORAGE_KEY)).toBe('blue');
    expect(root.dataset.penPhase).toBe('lift');
    expect(root.dataset.pen).toBeUndefined();

    act(() => vi.advanceTimersByTime(230));
    expect(root.dataset.penPhase).toBe('pre');
    expect(root.dataset.pen).toBe('blue');

    act(() => vi.advanceTimersByTime(32));
    expect(root.dataset.penPhase).toBe('draw');

    act(() => vi.advanceTimersByTime(700));
    expect(root.dataset.penPhase).toBeUndefined();
  });

  it('lets a superseded swap stand down once its frames have been queued', () => {
    render(<HighlighterFan />);
    fireEvent.click(pen('Blue'));
    act(() => vi.advanceTimersByTime(230));
    expect(root.dataset.penPhase).toBe('pre');

    fireEvent.click(pen('Green'));
    expect(root.dataset.penPhase).toBe('lift');

    act(() => vi.advanceTimersByTime(32));
    expect(root.dataset.penPhase, "blue's frames must not draw over green's lift").toBe('lift');

    act(() => vi.advanceTimersByTime(198));
    expect(root.dataset.pen).toBe('green');
    act(() => vi.advanceTimersByTime(32));
    expect(root.dataset.penPhase).toBe('draw');
    act(() => vi.advanceTimersByTime(699));
    expect(root.dataset.penPhase, "only green's own timer ends its draw").toBe('draw');
    act(() => vi.advanceTimersByTime(1));
    expect(root.dataset.penPhase).toBeUndefined();
  });

  it('returns to the default by removing the attribute rather than naming yellow', () => {
    root.dataset.pen = 'pink';
    preferences({ reducedMotion: true });
    render(<HighlighterFan />);

    fireEvent.click(pen('Yellow'));

    expect(root).not.toHaveAttribute('data-pen');
  });

  it('swaps at once, with no phases, under reduced motion', () => {
    preferences({ reducedMotion: true });
    render(<HighlighterFan />);

    fireEvent.click(pen('Pink'));

    expect(root.dataset.pen).toBe('pink');
    expect(root.dataset.penPhase).toBeUndefined();
  });

  it('ignores a pick of the pen already chosen', () => {
    render(<HighlighterFan />);

    fireEvent.click(pen('Yellow'));

    expect(root.dataset.penPhase).toBeUndefined();
    expect(localStorage.getItem(PEN_STORAGE_KEY)).toBeNull();
  });

  it('still applies the pen when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    preferences({ reducedMotion: true });
    render(<HighlighterFan />);

    fireEvent.click(pen('Green'));

    expect(root.dataset.pen).toBe('green');
  });

  it('opens on the first tap of a touch screen instead of picking', () => {
    preferences({ hover: false, reducedMotion: true });
    render(<HighlighterFan />);

    fireEvent.click(pen('Yellow'));
    expect(states()).toEqual({ Yellow: 'out', Blue: 'show', Green: 'show', Pink: 'show' });

    fireEvent.click(pen('Blue'));
    expect(root.dataset.pen).toBe('blue');
    expect(pen('Blue').dataset.state).toBe('rest');
  });

  it('closes without choosing when the open fan is tapped on the chosen pen', () => {
    preferences({ hover: false, reducedMotion: true });
    render(<HighlighterFan />);
    fireEvent.click(pen('Yellow'));

    fireEvent.click(pen('Yellow'));

    expect(states()).toEqual({ Yellow: 'rest', Blue: 'hide', Green: 'hide', Pink: 'hide' });
    expect(localStorage.getItem(PEN_STORAGE_KEY)).toBeNull();
  });

  it('picks on the first key press when keyboard focus has opened the fan on a touch screen', () => {
    preferences({ hover: false, reducedMotion: true });
    focusVisible(true);
    render(<HighlighterFan />);
    fireEvent.focus(pen('Yellow'));
    expect(pen('Blue').dataset.state).toBe('show');

    fireEvent.click(pen('Blue'));

    expect(root.dataset.pen).toBe('blue');
  });

  it('closes on a tap outside the fan', () => {
    preferences({ hover: false });
    render(<HighlighterFan />);
    fireEvent.click(pen('Yellow'));

    fireEvent.pointerDown(document.body);

    expect(pen('Yellow').dataset.state).toBe('rest');
  });

  it('opens under a pointer that can hover, and closes when it leaves', () => {
    render(<HighlighterFan />);
    const fan = screen.getByRole('group');

    fireEvent.mouseEnter(fan);
    expect(pen('Pink').dataset.state).toBe('show');

    fireEvent.mouseLeave(fan);
    act(() => vi.advanceTimersByTime(599));
    expect(pen('Pink').dataset.state, 'a gap between pens must not fold the fan').toBe('show');

    fireEvent.mouseEnter(fan);
    fireEvent.mouseLeave(fan);
    act(() => vi.advanceTimersByTime(599));
    expect(pen('Pink').dataset.state, 're-entering restarts the grace').toBe('show');

    act(() => vi.advanceTimersByTime(1));
    expect(pen('Pink').dataset.state).toBe('hide');
  });

  it('does not open for a hover a touch screen reports', () => {
    preferences({ hover: false });
    render(<HighlighterFan />);

    fireEvent.mouseEnter(screen.getByRole('group'));

    expect(pen('Pink').dataset.state).toBe('hide');
  });

  it('opens for keyboard focus, and Escape folds it back onto the chosen pen', () => {
    focusVisible(true);
    render(<HighlighterFan />);

    fireEvent.focus(pen('Yellow'));
    expect(pen('Green').dataset.state).toBe('show');

    pen('Green').focus();
    fireEvent.keyDown(pen('Green'), { key: 'Escape' });

    expect(pen('Yellow')).toHaveFocus();
    expect(pen('Green').dataset.state).toBe('hide');
  });

  it('ignores keys other than Escape', () => {
    focusVisible(true);
    render(<HighlighterFan />);
    fireEvent.focus(pen('Yellow'));

    fireEvent.keyDown(pen('Yellow'), { key: 'Enter' });

    expect(pen('Green').dataset.state).toBe('show');
  });

  it('stays closed for the focus a mouse click leaves behind', () => {
    focusVisible(false);
    render(<HighlighterFan />);

    fireEvent.focus(pen('Yellow'));

    expect(pen('Green').dataset.state).toBe('hide');
  });

  it('closes when focus leaves the fan, not when it moves between pens', () => {
    focusVisible(true);
    render(<HighlighterFan />);
    fireEvent.focus(pen('Yellow'));

    fireEvent.blur(pen('Yellow'), { relatedTarget: pen('Blue') });
    expect(pen('Green').dataset.state).toBe('show');

    fireEvent.blur(pen('Blue'), { relatedTarget: document.body });
    expect(pen('Green').dataset.state).toBe('hide');
  });

  it('rests out on arrival, and tucks for good once the page scrolls', () => {
    render(<HighlighterFan />);
    expect(pen('Yellow').dataset.state).toBe('rest');

    fireEvent.scroll(window);
    expect(pen('Yellow').dataset.state).toBe('tuck');

    act(() => vi.advanceTimersByTime(5000));
    expect(pen('Yellow').dataset.state, 'reading without scrolling must not bring it back').toBe(
      'tuck'
    );
  });

  it('starts tucked when a reload has already restored the page mid-scroll', () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    try {
      render(<HighlighterFan />);
      expect(pen('Yellow').dataset.state).toBe('tuck');
    } finally {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    }
  });

  it('folds back to the tuck once the pointer has left', () => {
    render(<HighlighterFan />);
    fireEvent.scroll(window);
    const fan = screen.getByRole('group');

    fireEvent.mouseEnter(fan);
    expect(pen('Yellow').dataset.state).toBe('out');

    fireEvent.mouseLeave(fan);
    act(() => vi.advanceTimersByTime(600));
    expect(pen('Yellow').dataset.state).toBe('tuck');
  });

  it('closes an open fan when the page scrolls', () => {
    preferences({ hover: false });
    render(<HighlighterFan />);
    fireEvent.click(pen('Yellow'));
    expect(pen('Blue').dataset.state).toBe('show');

    fireEvent.scroll(window);

    expect(pen('Blue').dataset.state).toBe('hide');
  });

  it('leaves no phase behind when torn down mid-swap', () => {
    const { unmount } = render(<HighlighterFan />);
    fireEvent.click(pen('Blue'));

    unmount();
    act(() => vi.advanceTimersByTime(1000));

    expect(root.dataset.penPhase).toBeUndefined();
    expect(root.dataset.pen).toBe('blue');
  });
});

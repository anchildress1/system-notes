import { useEffect, type RefObject } from 'react';

type TapeRange = Readonly<{
  start: number;
  end: number;
}>;

// The union below reads as "range mode XOR boundary mode," but a literal
// carrying keys from both branches still type-checks — TS only rejects a key
// unknown to every member, and each key here belongs to one. No caller does
// this today; don't rely on the type to catch it if one ever does.
export type TapeMotionOptions = Readonly<
  { selector: string; mediaQuery: string } & (
    { before: TapeRange; after: TapeRange } | { exitAbove: string }
  )
>;

function isDegenerateRange(range: TapeRange): boolean {
  return !Number.isFinite(range.start) || !Number.isFinite(range.end) || range.start === range.end;
}

type Tape = {
  element: HTMLElement;
  beforeTurn: number;
  afterTurn: number;
};

function turnAtEdge(edge: number, turn: number, start: number, end: number): string {
  const progress = Math.min(1, Math.max(0, (start - edge) / (start - end)));
  const eased = progress * progress * (3 - 2 * progress);
  return `${(turn * (1 - eased)).toFixed(3)}deg`;
}

export function useTapeMotion(rootRef: RefObject<HTMLElement | null>, options: TapeMotionOptions) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Validated before the native check below: a caller-supplied range must
    // fail the same way in every browser, not only the ones still running
    // this fallback.
    if (
      'before' in options &&
      (isDegenerateRange(options.before) || isDegenerateRange(options.after))
    ) {
      console.error('useTapeMotion: before/after range is not finite or has start === end.', {
        before: options.before,
        after: options.after,
      });
      return;
    }

    // A native equivalent exists in the stylesheet only for range mode
    // (ProjectDirectory's viewport-fraction before/after): its timing is
    // pure viewport-height fractions, expressible as a fixed native range
    // regardless of element size. exitAbove's (the About portrait's) timing
    // is anchored to wherever the element naturally sits on the page at
    // load — no native range is a function of that, only of element size or
    // viewport size — so it always runs the JS fallback, even natively.
    if ('before' in options && CSS.supports('animation-timeline: view()')) return;

    const preference = window.matchMedia(options.mediaQuery);
    let tapes: Tape[] = [];
    let boundary: Element | null = null;
    let frame: number | undefined;
    let observer: ResizeObserver | undefined;

    const clear = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      observer?.disconnect();
      observer = undefined;
      tapes.forEach(({ element }) => {
        element.style.removeProperty('--tape-before-turn');
        element.style.removeProperty('--tape-after-turn');
      });
      tapes = [];
    };

    const update = () => {
      frame = undefined;
      const positions = tapes.map(({ element }) => element.getBoundingClientRect());
      const boundaryBottom = boundary?.getBoundingClientRect().bottom ?? 0;
      const turn = (edge: number, angle: number, side: 'before' | 'after') => {
        if ('exitAbove' in options) {
          // Each edge folds across its own travel from the page top to the sticky header.
          const restingEdge = Math.max(boundaryBottom + 1, edge + window.scrollY);
          return turnAtEdge(edge, angle, boundaryBottom, restingEdge);
        }
        const range = options[side];
        return turnAtEdge(
          edge,
          angle,
          window.innerHeight * range.start,
          window.innerHeight * range.end
        );
      };
      tapes.forEach(({ element, beforeTurn, afterTurn }, index) => {
        const bounds = positions[index];
        element.style.setProperty('--tape-before-turn', turn(bounds.top, beforeTurn, 'before'));
        element.style.setProperty('--tape-after-turn', turn(bounds.bottom, afterTurn, 'after'));
      });
    };

    const queueUpdate = () => {
      if (tapes.length) frame ??= window.requestAnimationFrame(update);
    };

    const configure = () => {
      clear();
      if (!preference.matches) return;

      const elements = Array.from(root.querySelectorAll<HTMLElement>(options.selector));
      if (!elements.length) {
        console.error('useTapeMotion: selector matched no elements.', {
          selector: options.selector,
        });
        return;
      }
      boundary = 'exitAbove' in options ? document.querySelector(options.exitAbove) : null;
      if ('exitAbove' in options && !boundary) {
        console.error('useTapeMotion: exitAbove selector matched no element; folding against 0.', {
          exitAbove: options.exitAbove,
        });
      }

      tapes = elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const beforeTurn = Number.parseFloat(style.getPropertyValue('--tape-before-start-turn'));
        const afterTurn = Number.parseFloat(style.getPropertyValue('--tape-after-start-turn'));
        if (!Number.isFinite(beforeTurn) || !Number.isFinite(afterTurn)) {
          console.error(
            'useTapeMotion: --tape-before-start-turn/--tape-after-start-turn missing or invalid.',
            { element, beforeTurn, afterTurn }
          );
          return [];
        }
        return [{ element, beforeTurn, afterTurn }];
      });
      if (!tapes.length) return;

      observer = new ResizeObserver(queueUpdate);
      observer.observe(root);
      if (boundary) observer.observe(boundary);
      tapes.forEach(({ element }) => observer!.observe(element));
      update();
    };

    configure();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    preference.addEventListener('change', configure);

    return () => {
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      preference.removeEventListener('change', configure);
      clear();
    };
  }, [rootRef, options]);
}

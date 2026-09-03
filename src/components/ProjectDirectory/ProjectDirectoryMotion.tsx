'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const desktopMotionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 48.01rem)';
const motionPartSelector = '[data-motion-part]';
const tapeMediaSelector = '[data-motion-part="media"]';
const animationDuration = 1000;
const topTapeStart = 0.58;
const topTapeEnd = 0.18;
const bottomTapeStart = 1.05;
const bottomTapeEnd = 0.82;

type MotionPart = {
  animation: Animation;
  element: HTMLElement;
  range: number;
};

type TapeMotion = {
  afterTurn: number;
  beforeTurn: number;
  element: HTMLElement;
};

function edgeProgress(edge: number, start: number, end: number): number {
  const progress = Math.min(1, Math.max(0, (start - edge) / (start - end)));
  return progress * progress * (3 - 2 * progress);
}

function tapeTurn(start: number, progress: number): string {
  return `${(start * (1 - progress)).toFixed(3)}deg`;
}

function applyTapeMotion(tape: TapeMotion) {
  const bounds = tape.element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const beforeProgress = edgeProgress(
    bounds.top,
    viewportHeight * topTapeStart,
    viewportHeight * topTapeEnd
  );
  const afterProgress = edgeProgress(
    bounds.bottom,
    viewportHeight * bottomTapeStart,
    viewportHeight * bottomTapeEnd
  );

  tape.element.style.setProperty('--tape-before-turn', tapeTurn(tape.beforeTurn, beforeProgress));
  tape.element.style.setProperty('--tape-after-turn', tapeTurn(tape.afterTurn, afterProgress));
}

function clearTapeMotion(tape: TapeMotion) {
  tape.element.style.removeProperty('--tape-before-turn');
  tape.element.style.removeProperty('--tape-after-turn');
}

type ProjectDirectoryMotionProps = {
  children: ReactNode;
  className: string;
};

export function ProjectDirectoryMotion({
  children,
  className,
}: Readonly<ProjectDirectoryMotionProps>) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionPreference = window.matchMedia(desktopMotionQuery);
    let tapes: TapeMotion[] = [];
    let frame: number | undefined;

    const updateTapes = () => {
      frame = undefined;
      tapes.forEach(applyTapeMotion);
    };

    const queueUpdate = () => {
      frame ??= window.requestAnimationFrame(updateTapes);
    };

    const configureTapes = () => {
      tapes.forEach(clearTapeMotion);
      tapes = [];

      if (!motionPreference.matches) return;

      tapes = Array.from(root.querySelectorAll<HTMLElement>(tapeMediaSelector)).map((element) => {
        const style = getComputedStyle(element);
        return {
          element,
          beforeTurn: Number.parseFloat(style.getPropertyValue('--tape-before-start-turn')),
          afterTurn: Number.parseFloat(style.getPropertyValue('--tape-after-start-turn')),
        };
      });
      updateTapes();
    };

    configureTapes();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    motionPreference.addEventListener('change', configureTapes);

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      motionPreference.removeEventListener('change', configureTapes);
      tapes.forEach(clearTapeMotion);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || CSS.supports('animation-timeline: view()') || !('animate' in Element.prototype)) {
      return;
    }

    const motionPreference = window.matchMedia(desktopMotionQuery);
    let parts: MotionPart[] = [];
    let frame: number | undefined;

    const clearFallback = () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
        frame = undefined;
      }

      parts.forEach(({ animation }) => animation.cancel());
      parts = [];
      delete root.dataset.motionFallback;
    };

    const updateFallback = () => {
      frame = undefined;

      parts.forEach(({ animation, element, range }) => {
        const bounds = element.getBoundingClientRect();
        const travel = (window.innerHeight + bounds.height) * range;
        const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / travel));
        animation.currentTime = progress * animationDuration;
      });
    };

    const queueUpdate = () => {
      frame ??= window.requestAnimationFrame(updateFallback);
    };

    const configureFallback = () => {
      clearFallback();

      if (!motionPreference.matches) {
        return;
      }

      root.dataset.motionFallback = 'true';
      const elements = Array.from(root.querySelectorAll<HTMLElement>(motionPartSelector));
      parts = elements.flatMap((element) => {
        const style = getComputedStyle(element);
        // The stylesheet owns the range. Without one there is nothing to scrub
        // against, and a NaN currentTime throws and strands every later part.
        const range = Number.parseFloat(style.getPropertyValue('--cover-range')) / 100;
        if (!Number.isFinite(range) || range <= 0) return [];
        const animation = element.animate(
          [
            {
              scale: style.scale === 'none' ? '1' : style.scale,
              translate: style.translate,
            },
            { scale: '1', translate: '0px' },
          ],
          { duration: animationDuration, easing: 'linear', fill: 'both' }
        );

        animation.pause();
        return [{ animation, element, range }];
      });
      updateFallback();
    };

    configureFallback();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    motionPreference.addEventListener('change', configureFallback);

    return () => {
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      motionPreference.removeEventListener('change', configureFallback);
      clearFallback();
    };
  }, []);

  return (
    <section ref={rootRef} className={className} aria-label="Selected exhibits">
      {children}
    </section>
  );
}

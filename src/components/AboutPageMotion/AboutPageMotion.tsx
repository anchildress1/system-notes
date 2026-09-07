'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const motionQuery = '(prefers-reduced-motion: no-preference)';
const partSelector = '[data-motion-part="principle"]';
const animationDuration = 1000;

type MotionPart = {
  animation: Animation;
  element: HTMLElement;
  range: number;
};

type AboutPageMotionProps = {
  children: ReactNode;
};

export function AboutPageMotion({ children }: Readonly<AboutPageMotionProps>) {
  const rootRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || CSS.supports('animation-timeline: view()') || !('animate' in Element.prototype)) {
      return;
    }

    const motionPreference = window.matchMedia(motionQuery);
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
      const elements = Array.from(root.querySelectorAll<HTMLElement>(partSelector));
      parts = elements.flatMap((element) => {
        const style = getComputedStyle(element);
        // The stylesheet owns the range. Without one there is nothing to scrub
        // against, and a NaN currentTime throws and strands every later part.
        const range = Number.parseFloat(style.getPropertyValue('--cover-range')) / 100;
        if (!Number.isFinite(range) || range <= 0) return [];
        const animation = element.animate([{ transform: style.transform }, { transform: 'none' }], {
          duration: animationDuration,
          easing: 'linear',
          fill: 'both',
        });

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

  return <ol ref={rootRef}>{children}</ol>;
}

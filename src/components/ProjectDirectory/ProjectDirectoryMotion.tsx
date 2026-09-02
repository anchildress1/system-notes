'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const desktopMotionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 48.01rem)';
const motionPartSelector = '[data-motion-part]';
const animationDuration = 1000;
const coverRange = {
  copy: 0.32,
  media: 0.36,
  references: 0.24,
} as const;

type MotionPart = {
  animation: Animation;
  element: HTMLElement;
  range: number;
};

type ProjectDirectoryMotionProps = {
  children: ReactNode;
  className: string;
};

export function ProjectDirectoryMotion({ children, className }: ProjectDirectoryMotionProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || CSS.supports('animation-timeline: view()') || !('animate' in Element.prototype)) {
      return;
    }

    const motionPreference = window.matchMedia(desktopMotionQuery);
    const elements = Array.from(root.querySelectorAll<HTMLElement>(motionPartSelector));
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
      if (frame === undefined) {
        frame = window.requestAnimationFrame(updateFallback);
      }
    };

    const configureFallback = () => {
      clearFallback();

      if (!motionPreference.matches) {
        return;
      }

      root.dataset.motionFallback = 'true';
      parts = elements.map((element) => {
        const style = getComputedStyle(element);
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
        const part = element.dataset.motionPart as keyof typeof coverRange;

        animation.pause();
        return { animation, element, range: coverRange[part] };
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

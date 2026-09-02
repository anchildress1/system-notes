'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const desktopMotionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 48.01rem)';
const motionPartSelector = '[data-motion-part]';

type ProjectDirectoryMotionProps = {
  children: ReactNode;
  className: string;
};

export function ProjectDirectoryMotion({ children, className }: ProjectDirectoryMotionProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (
      !root ||
      CSS.supports('animation-timeline: view()') ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }

    const motionPreference = window.matchMedia(desktopMotionQuery);
    const parts = Array.from(root.querySelectorAll<HTMLElement>(motionPartSelector));
    let observer: IntersectionObserver | undefined;
    let frame: number | undefined;

    const clearFallback = () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
        frame = undefined;
      }

      observer?.disconnect();
      observer = undefined;
      delete root.dataset.motionFallback;
      parts.forEach((part) => delete part.dataset.motionState);
    };

    const configureFallback = () => {
      clearFallback();

      if (!motionPreference.matches) {
        return;
      }

      root.dataset.motionFallback = 'true';
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const part = entry.target as HTMLElement;
            part.dataset.motionState = 'arrived';
            observer?.unobserve(part);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
      );

      frame = window.requestAnimationFrame(() => {
        parts.forEach((part) => {
          if (part.getBoundingClientRect().top < window.innerHeight * 0.92) {
            return;
          }

          part.dataset.motionState = 'waiting';
          observer?.observe(part);
        });
      });
    };

    configureFallback();
    motionPreference.addEventListener('change', configureFallback);

    return () => {
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

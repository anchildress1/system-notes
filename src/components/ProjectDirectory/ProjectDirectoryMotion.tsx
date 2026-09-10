'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTapeMotion } from '@/hooks/useTapeMotion';

const desktopMotionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 48.01rem)';
const motionPartSelector = '[data-motion-part]';
const animationDuration = 1000;
// Mirrored as entry/contain length offsets in ProjectDirectory.module.css's
// native animation-range, and as literal ratios in cross-browser.spec.ts.
// Nothing enforces the three copies against each other; changing these
// values means updating all three.
const tapeMotion = {
  selector: '[data-motion-part="media"]',
  mediaQuery: desktopMotionQuery,
  before: { start: 0.58, end: 0.18 },
  after: { start: 1.05, end: 0.82 },
};

type MotionPart = {
  animation: Animation;
  element: HTMLElement;
  range: number;
};

type ProjectDirectoryMotionProps = {
  children: ReactNode;
  className: string;
};

export function ProjectDirectoryMotion({
  children,
  className,
}: Readonly<ProjectDirectoryMotionProps>) {
  const rootRef = useRef<HTMLElement>(null);
  useTapeMotion(rootRef, tapeMotion);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || CSS.supports('animation-timeline: view()')) return;
    if (!('animate' in Element.prototype)) {
      console.error(
        'ProjectDirectoryMotion: Web Animations API unavailable; scroll motion cannot run.'
      );
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

    const readProgress = (element: HTMLElement, range: number) => {
      // Rendered bounds include the previous pose and would feed it back into progress.
      // This catalogue scrolls with the window, without fixed or nested scrolling ancestors.
      let documentTop = element.offsetTop;
      for (
        let parent = element.offsetParent as HTMLElement | null;
        parent;
        parent = parent.offsetParent as HTMLElement | null
      ) {
        documentTop += parent.offsetTop + parent.clientTop;
      }
      const top = documentTop - window.scrollY;
      const travel = (window.innerHeight + element.offsetHeight) * range;
      return Math.min(1, Math.max(0, (window.innerHeight - top) / travel));
    };

    const updateFallback = () => {
      frame = undefined;

      const updates = parts.map(({ animation, element, range }) => ({
        animation,
        progress: readProgress(element, range),
      }));

      updates.forEach(({ animation, progress }) => {
        // A hidden or zero-height viewport makes travel 0 and progress NaN, and
        // an animation's currentTime throws a TypeError for anything that
        // isn't finite — out of this same unguarded passive effect.
        if (!Number.isFinite(progress)) return;
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

      // Entry transforms exist only while the fallback selector matches.
      root.dataset.motionFallback = 'true';
      const elements = Array.from(root.querySelectorAll<HTMLElement>(motionPartSelector));
      const entries = elements.flatMap((element) => {
        const style = getComputedStyle(element);
        // The stylesheet owns the range. Without one there is nothing to scrub
        // against, and a NaN currentTime throws and strands every later part.
        const range = Number.parseFloat(style.getPropertyValue('--cover-range')) / 100;
        if (!Number.isFinite(range) || range <= 0) {
          console.error('ProjectDirectoryMotion: --cover-range missing or invalid.', {
            element,
            range,
          });
          return [];
        }
        return [
          {
            element,
            range,
            scale: style.scale === 'none' ? '1' : style.scale,
            translate: style.translate,
            progress: readProgress(element, range),
          },
        ];
      });
      parts = entries.map(({ element, range, scale, translate, progress }) => {
        const animation = element.animate(
          [
            { scale, translate },
            { scale: '1', translate: '0px' },
          ],
          { duration: animationDuration, easing: 'linear', fill: 'both' }
        );

        animation.pause();
        // Initial geometry must be read before any animation dirties the styles.
        if (Number.isFinite(progress)) animation.currentTime = progress * animationDuration;
        return { animation, element, range };
      });
      if (!parts.length) {
        delete root.dataset.motionFallback;
      }
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

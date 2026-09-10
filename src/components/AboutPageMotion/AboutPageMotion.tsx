'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTapeMotion } from '@/hooks/useTapeMotion';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 55.01rem)';
const duration = 1000;
const tapeMotion = {
  selector: '[data-about-tape]',
  mediaQuery: motionQuery,
  exitAbove: 'body > header',
};

type Annotation = {
  animation: Animation;
  source: HTMLElement;
  start: number;
  end: number;
};

export function AboutPageMotion({
  children,
  className,
}: Readonly<{ children: ReactNode; className: string }>) {
  const rootRef = useRef<HTMLElement>(null);
  useTapeMotion(rootRef, tapeMotion);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || CSS.supports('animation-timeline: view()')) return;
    if (!('animate' in Element.prototype)) {
      console.error('AboutPageMotion: Web Animations API unavailable; scroll motion cannot run.');
      return;
    }

    const preference = window.matchMedia(motionQuery);
    let annotations: Annotation[] = [];
    let frame: number | undefined;

    const clear = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      annotations.forEach(({ animation }) => animation.cancel());
      annotations = [];
      delete root.dataset.motionFallback;
    };

    const update = () => {
      frame = undefined;
      if (CSS.supports('animation-timeline: view()')) {
        clear();
        return;
      }

      // Read the stationary scene, never the mark whose transform we are writing.
      const positions = annotations.map(({ source }) => source.getBoundingClientRect().top);
      annotations.forEach(({ animation, start, end }, index) => {
        const progress =
          (window.innerHeight * start - positions[index]) / (window.innerHeight * (start - end));
        // A hidden or zero-height viewport (window.innerHeight === 0) makes this
        // NaN, and an animation's currentTime throws a TypeError for anything
        // that isn't finite — out of this same unguarded passive effect.
        if (!Number.isFinite(progress)) return;
        animation.currentTime = Math.min(1, Math.max(0, progress)) * duration;
      });
    };

    const queueUpdate = () => {
      if (annotations.length) frame ??= window.requestAnimationFrame(update);
    };

    // A mistyped --motion-start/--motion-end/--motion-from anywhere in
    // page.module.css otherwise fails invisibly: the browser accepts the CSS
    // and getComputedStyle happily returns garbage, so nothing here ever
    // throws — it just silently produces no motion. Every rejection is logged
    // and skipped instead of left to that silence.
    const configure = () => {
      clear();
      if (!preference.matches || CSS.supports('animation-timeline: view()')) return;

      annotations = Array.from(root.querySelectorAll<HTMLElement>('[data-about-scene]')).flatMap(
        (source) =>
          Array.from(source.querySelectorAll<HTMLElement>('[data-about-motion]')).flatMap(
            (target) => {
              const style = getComputedStyle(target);
              const start = Number.parseFloat(style.getPropertyValue('--motion-start'));
              const end = Number.parseFloat(style.getPropertyValue('--motion-end'));
              const from = style.getPropertyValue('--motion-from').trim();
              if (!Number.isFinite(start) || !Number.isFinite(end) || start <= end || !from) {
                console.error(
                  'AboutPageMotion: --motion-start/--motion-end/--motion-from missing or invalid.',
                  { target, start, end, from }
                );
                return [];
              }

              // An invalid `from` transform is not thrown here — the Web
              // Animations spec discards an unparseable keyframe value rather
              // than rejecting the call — so there is nothing to catch below.
              const animation = target.animate([{ transform: from }, { transform: 'none' }], {
                duration,
                easing: 'linear',
                fill: 'both',
              });
              animation.pause();
              return [{ animation, source, start, end }];
            }
          )
      );
      if (!annotations.length) return;
      // Read before write: update() calls getBoundingClientRect(), and this
      // attribute is what page.module.css keys its scroll-fallback rules off —
      // setting it first invalidates style, then the geometry read forces a
      // synchronous layout flush to answer it.
      update();
      root.dataset.motionFallback = 'true';
    };

    const observer = new ResizeObserver(queueUpdate);
    observer.observe(root);
    root.querySelectorAll('[data-about-scene]').forEach((source) => observer.observe(source));
    configure();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    preference.addEventListener('change', configure);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      preference.removeEventListener('change', configure);
      clear();
    };
  }, []);

  return (
    <main id="main-content" ref={rootRef} className={className}>
      {children}
    </main>
  );
}

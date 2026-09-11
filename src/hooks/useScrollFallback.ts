import { useEffect, type RefObject } from 'react';

export type ScrollFallbackEntry<TGeometry> = {
  element: HTMLElement;
  keyframes: Keyframe[];
  geometry: TGeometry;
};

export type ScrollFallbackOptions<TGeometry> = {
  label: string;
  mediaQuery: string;
  duration: number;
  // Finds targets, validates their configuration, and builds their keyframes.
  // Runs once per configure() and owns its own console.error on a bad target.
  discover: (root: HTMLElement) => ScrollFallbackEntry<TGeometry>[];
  // Computes progress (0-1, or non-finite to skip) for every entry in one
  // batch — not one call per entry — so a caller whose entries can share a
  // read (multiple targets against one stationary ancestor) can dedupe it
  // itself. Order must match the geometries given.
  readAll: (geometries: TGeometry[]) => number[];
  // 'before': set data-motion-fallback, then discover/read — for a consumer
  // whose discovery reads CSS gated on that attribute (ProjectDirectory's
  // --cover-range/scale/translate). 'after': discover/read, then set the
  // attribute — for a consumer whose read doesn't depend on it, so the
  // attribute-gated stylesheet never sees an unread frame (About's
  // getBoundingClientRect against a stationary scene).
  attributeTiming: 'before' | 'after';
  // Elements to ResizeObserver beyond scroll/resize/preference-change,
  // typically root plus whatever discover() found. Omit for a consumer
  // whose targets can't resize independently of the viewport.
  resizeObserverTargets?: (root: HTMLElement) => Element[];
};

type Active<TGeometry> = {
  animation: Animation;
  geometry: TGeometry;
};

/** Drives a paused WAAPI animation per target, scrubbed by hand, wherever the
 * browser has no native scroll timeline. */
export function useScrollFallback<TGeometry>(
  rootRef: RefObject<HTMLElement | null>,
  options: ScrollFallbackOptions<TGeometry>
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || CSS.supports('animation-timeline: view()')) return;
    if (!('animate' in Element.prototype)) {
      console.error(`${options.label}: Web Animations API unavailable; scroll motion cannot run.`);
      return;
    }

    const preference = window.matchMedia(options.mediaQuery);
    let entries: Active<TGeometry>[] = [];
    let frame: number | undefined;

    const clear = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      entries.forEach(({ animation }) => animation.cancel());
      entries = [];
      delete root.dataset.motionFallback;
    };

    const apply = (progresses: number[]) => {
      entries.forEach(({ animation }, index) => {
        const progress = progresses[index];
        // A hidden or zero-height viewport makes progress NaN, and an
        // animation's currentTime throws a TypeError for anything that
        // isn't finite — out of this same unguarded passive effect.
        if (!Number.isFinite(progress)) return;
        animation.currentTime = Math.min(1, Math.max(0, progress)) * options.duration;
      });
    };

    const update = () => {
      frame = undefined;
      if (CSS.supports('animation-timeline: view()')) {
        clear();
        return;
      }
      apply(options.readAll(entries.map(({ geometry }) => geometry)));
    };

    const queueUpdate = () => {
      if (entries.length) frame ??= window.requestAnimationFrame(update);
    };

    const configure = () => {
      clear();
      if (!preference.matches || CSS.supports('animation-timeline: view()')) return;

      if (options.attributeTiming === 'before') root.dataset.motionFallback = 'true';

      const discovered = options.discover(root);
      if (!discovered.length) {
        if (options.attributeTiming === 'before') delete root.dataset.motionFallback;
        return;
      }

      // Every geometry read happens here, before any .animate() call exists
      // for any entry — an already-applied animation's fill: both pose would
      // otherwise leak into whichever geometry function this consumer reads.
      const progresses = options.readAll(discovered.map(({ geometry }) => geometry));

      entries = discovered.map(({ element, keyframes, geometry }) => {
        const animation = element.animate(keyframes, {
          duration: options.duration,
          easing: 'linear',
          fill: 'both',
        });
        animation.pause();
        return { animation, geometry };
      });
      apply(progresses);

      if (options.attributeTiming === 'after') root.dataset.motionFallback = 'true';
    };

    const observer = options.resizeObserverTargets ? new ResizeObserver(queueUpdate) : undefined;
    if (observer)
      options.resizeObserverTargets!(root).forEach((target) => observer.observe(target));
    configure();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    preference.addEventListener('change', configure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      preference.removeEventListener('change', configure);
      clear();
    };
  }, [rootRef, options]);
}

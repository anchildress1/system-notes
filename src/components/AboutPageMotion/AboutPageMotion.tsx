'use client';

import { useRef, type ReactNode } from 'react';
import { useScrollFallback, type ScrollFallbackEntry } from '@/hooks/useScrollFallback';
import { useTapeMotion } from '@/hooks/useTapeMotion';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-width: 55.01rem)';
const duration = 1000;
const tapeMotion = {
  selector: '[data-about-tape]',
  mediaQuery: motionQuery,
  exitAbove: 'body > header',
};

type AnnotationGeometry = {
  source: HTMLElement;
  start: number;
  end: number;
};

// A mistyped --motion-start/--motion-end/--motion-from anywhere in
// page.module.css otherwise fails invisibly: the browser accepts the CSS and
// getComputedStyle happily returns garbage, so nothing here ever throws — it
// just silently produces no motion. Every rejection is logged and skipped
// instead of left to that silence.
function discoverAnnotations(root: HTMLElement): ScrollFallbackEntry<AnnotationGeometry>[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-about-scene]')).flatMap((source) =>
    Array.from(source.querySelectorAll<HTMLElement>('[data-about-motion]')).flatMap((target) => {
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

      // An invalid `from` transform is not thrown here — the Web Animations
      // spec discards an unparseable keyframe value rather than rejecting the
      // call — so there is nothing to catch below.
      return [
        {
          element: target,
          keyframes: [{ transform: from }, { transform: 'none' }],
          geometry: { source, start, end },
        },
      ];
    })
  );
}

// Read the stationary scene, never the mark whose transform we are writing.
// Keyed by source rather than by index: a scene with several targets shares
// one entry instead of re-reading the same rect per target.
function readAnnotationProgress(geometries: AnnotationGeometry[]): number[] {
  const tops = new Map<HTMLElement, number>();
  for (const { source } of geometries) {
    if (!tops.has(source)) tops.set(source, source.getBoundingClientRect().top);
  }
  return geometries.map(({ source, start, end }) => {
    const top = tops.get(source)!;
    return (window.innerHeight * start - top) / (window.innerHeight * (start - end));
  });
}

const annotationMotion = {
  label: 'AboutPageMotion',
  mediaQuery: motionQuery,
  duration,
  discover: discoverAnnotations,
  readAll: readAnnotationProgress,
  attributeTiming: 'after' as const,
  resizeObserverTargets: (root: HTMLElement) => [
    root,
    ...Array.from(root.querySelectorAll('[data-about-scene]')),
  ],
};

export function AboutPageMotion({
  children,
  className,
}: Readonly<{ children: ReactNode; className: string }>) {
  const rootRef = useRef<HTMLElement>(null);
  useTapeMotion(rootRef, tapeMotion);
  useScrollFallback(rootRef, annotationMotion);

  return (
    <main id="main-content" ref={rootRef} className={className}>
      {children}
    </main>
  );
}

'use client';

import { useRef, type ReactNode } from 'react';
import { useScrollFallback, type ScrollFallbackEntry } from '@/hooks/useScrollFallback';
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

type PartGeometry = {
  element: HTMLElement;
  range: number;
};

// Rendered bounds include the previous pose and would feed it back into
// progress. This catalogue scrolls with the window, without fixed or nested
// scrolling ancestors.
function readPartProgress({ element, range }: PartGeometry): number {
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
  return (window.innerHeight - top) / travel;
}

// The stylesheet owns the range. Without one there is nothing to scrub
// against, and a NaN currentTime throws and strands every later part.
function discoverParts(root: HTMLElement): ScrollFallbackEntry<PartGeometry>[] {
  return Array.from(root.querySelectorAll<HTMLElement>(motionPartSelector)).flatMap((element) => {
    const style = getComputedStyle(element);
    const range = Number.parseFloat(style.getPropertyValue('--cover-range')) / 100;
    if (!Number.isFinite(range) || range <= 0) {
      console.error('ProjectDirectoryMotion: --cover-range missing or invalid.', {
        element,
        range,
      });
      return [];
    }
    const scale = style.scale === 'none' ? '1' : style.scale;
    const translate = style.translate;
    return [
      {
        element,
        keyframes: [
          { scale, translate },
          { scale: '1', translate: '0px' },
        ],
        geometry: { element, range },
      },
    ];
  });
}

const exhibitMotion = {
  label: 'ProjectDirectoryMotion',
  mediaQuery: desktopMotionQuery,
  duration: animationDuration,
  discover: discoverParts,
  readAll: (geometries: PartGeometry[]) => geometries.map(readPartProgress),
  attributeTiming: 'before' as const,
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
  useScrollFallback(rootRef, exhibitMotion);

  return (
    <section ref={rootRef} className={className} aria-label="Selected exhibits">
      {children}
    </section>
  );
}

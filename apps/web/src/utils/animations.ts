/**
 * Shared Framer Motion animation variants and transitions.
 * Keeps Choices (search) and Builds (projects) pages consistent.
 * Durations align with globals.css tokens:
 *   --transition-fast: 0.15s
 *   --transition-base: 0.2s
 *   --transition-slow: 0.3s
 */

import type { Transition, Variants } from 'framer-motion';

/* ── Easing curves (mirrors CSS custom properties) ── */
export const easeSpring: [number, number, number, number] = [0.175, 0.885, 0.32, 1.275];
export const easeMorph: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* ── Card-flip overlay (background dim) ── */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const overlayTransition: Transition = { duration: 0.12, ease: 'easeOut' };

/* ── Card-flip expanded view (open + close) ── */
export const cardFlipVariants: Variants = {
  hidden: { rotateY: 90, opacity: 0, scale: 0.85 },
  visible: { rotateY: 0, opacity: 1, scale: 1 },
  exit: { rotateY: -90, opacity: 0, scale: 0.85 },
};

export const cardFlipTransition: Transition = {
  rotateY: { duration: 0.25, ease: easeSpring },
  opacity: { duration: 0.15, ease: 'easeOut' },
  scale: { duration: 0.25, ease: easeSpring },
  layout: { duration: 0.2, ease: easeMorph },
};

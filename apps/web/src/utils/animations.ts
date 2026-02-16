/**
 * Shared Framer Motion animation variants and transitions.
 * Keeps Choices (search) and Builds (projects) pages consistent.
 * Durations align with globals.css tokens:
 *   --transition-fast: 0.15s
 *   --transition-base: 0.2s
 *   --transition-slow: 0.3s
 */

/* ── Easing curves (mirrors CSS custom properties) ── */
export const easeSpring: [number, number, number, number] = [0.175, 0.885, 0.32, 1.275];
export const easeMorph: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* ── Card-flip overlay (background dim) ── */
export const overlayTransition = { duration: 0.12, ease: 'easeOut' as const };

/* ── Card-flip expanded view (open + close) ── */
const flipEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const cardFlipVariants = {
  hidden: { rotateY: 90, opacity: 0, scale: 0.92 },
  visible: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: {
      rotateY: { duration: 0.2, ease: flipEase },
      opacity: { duration: 0.15, ease: 'easeOut' },
      scale: { duration: 0.2, ease: flipEase },
    },
  },
  exit: {
    rotateY: -45,
    opacity: 0,
    scale: 0.92,
    transition: {
      rotateY: { duration: 0.18, ease: flipEase },
      opacity: { duration: 0.12, ease: 'easeIn' },
      scale: { duration: 0.18, ease: flipEase },
    },
  },
} as const;

'use client';

import styles from './Masthead.module.css';

const TICKER_ITEMS = [
  'I BUILD THINGS',
  'I BREAK THINGS',
  'I SHIP THINGS',
  'I FIX THE THINGS I BREAK',
  'I BUILD THINGS',
  'BREAK EARLY · BREAK LOUD · BREAK ON PURPOSE',
  'I BUILD THINGS',
  'EVERY FILE EARNED ITS CHANGE',
] as const;

// Duplicate for a seamless loop; each copy carries a stable, unique key so the
// non-reordering marquee never falls back to bare array-index keys.
const ALL_ITEMS = [
  ...TICKER_ITEMS.map((item, i) => ({ item, key: `a-${i}` })),
  ...TICKER_ITEMS.map((item, i) => ({ item, key: `b-${i}` })),
];

// Accent phrases cycle through the three neon accents.
const ACCENT_CLASSES = [styles.accentPink, styles.accentViolet, styles.accentTeal];

export default function Masthead() {
  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {ALL_ITEMS.map(({ item, key }, i) => {
          // Use position within one copy so both halves of the duplicated
          // list have identical coloring — keeps the loop seam invisible.
          // Spacing of 3 ensures all three accent colors cycle within 8 items.
          const baseIndex = i % TICKER_ITEMS.length;
          const accentClass =
            baseIndex % 3 === 0
              ? (ACCENT_CLASSES[Math.floor(baseIndex / 3) % ACCENT_CLASSES.length] ?? '')
              : '';
          return (
            <span key={key} className={`${styles.tickerItem} ${accentClass}`}>
              <span>{item}</span>
              <span className={styles.tickerSep} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

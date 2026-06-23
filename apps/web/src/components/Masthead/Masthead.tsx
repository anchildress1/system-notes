'use client';

import styles from './Masthead.module.css';

const TICKER_ITEMS = [
  'SEARCHABLE PORTFOLIO',
  'SYSTEM NOTES',
  'SHIPPED BUILDS',
  'DECISION LOGS',
  'AI SYSTEMS',
  'FULL-STACK TOOLS',
  'WORKING PROTOTYPES',
  'LESS VIBES, MORE PROOF',
] as const;

// Duplicate for a seamless loop; each copy carries a stable, unique key so the
// non-reordering marquee never falls back to bare array-index keys.
const ALL_ITEMS = [
  ...TICKER_ITEMS.map((item, i) => ({ item, key: `a-${i}` })),
  ...TICKER_ITEMS.map((item, i) => ({ item, key: `b-${i}` })),
];

export default function Masthead() {
  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {ALL_ITEMS.map(({ item, key }) => (
          <span key={key} className={styles.tickerItem}>
            <span>{item}</span>
            <span className={styles.tickerSep} />
          </span>
        ))}
      </div>
    </div>
  );
}

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

// Duplicate for seamless loop
const ALL_ITEMS = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function Masthead() {
  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {ALL_ITEMS.map((item, i) => (
          <span key={i} className={`${styles.tickerItem} ${i % 4 === 0 ? styles.accent : ''}`}>
            <span>{item}</span>
            <span className={styles.tickerSep} />
          </span>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import styles from '@/styles/SharedHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function FactsHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.interactiveContainer}>
        <h1 className={styles.title}>Decisions on record</h1>
        <span className={styles.subtitle}>so you can audit me</span>
        <button
          type="button"
          className={styles.glitterTrigger}
          onClick={() => {
            if (typeof globalThis !== 'undefined') {
              globalThis.dispatchEvent(new Event('trigger-glitter-bomb'));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (typeof globalThis !== 'undefined') {
                globalThis.dispatchEvent(new Event('trigger-glitter-bomb'));
              }
            }
          }}
          aria-label="Click to trigger a glitter effect"
        />
      </div>
    </div>
  );
}

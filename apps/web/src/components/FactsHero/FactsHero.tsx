'use client';

import { useRef } from 'react';
import styles from '@/styles/SharedHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function FactsHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div
        role="button"
        tabIndex={0}
        className={styles.interactiveContainer}
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('trigger-glitter-bomb'));
            }
          }
        }}
        aria-label="Click to trigger a glitter effect"
      >
        <h1 className={styles.title}>Fact Index</h1>
        <div className={styles.subtitle}>Indexed insights from the engineering trenches</div>
      </div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import styles from '@/styles/SharedHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function FactsHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef, textRef, sparkleNearText: true });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.interactiveContainer} ref={textRef}>
        <h1 className={styles.title}>Decisions on record</h1>
        <span className={styles.subtitle}>so you can audit me</span>
        <button
          type="button"
          className={styles.glitterTrigger}
          onClick={(e) =>
            globalThis.dispatchEvent(
              new CustomEvent('trigger-glitter-bomb', {
                detail: { x: e.clientX, y: e.clientY },
              })
            )
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
            }
          }}
          aria-label="Click to trigger a glitter effect"
        />
      </div>
    </div>
  );
}

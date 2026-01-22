'use client';

import { useRef } from 'react';
import styles from './Hero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div
        className={styles.title}
        onClick={() => window.dispatchEvent(new Event('trigger-glitter-bomb'))}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }
        }}
      >
        Disruption is a feature, <br /> not a bug.
      </div>
      <div className={styles.subtitle}>Not here to play nice. Just to play loud.</div>
    </div>
  );
}

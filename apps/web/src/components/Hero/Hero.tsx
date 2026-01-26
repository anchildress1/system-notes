'use client';

import { useRef } from 'react';
import styles from './Hero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // useSparkles({ containerRef });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '0 1rem',
        position: 'relative',
      }}
      ref={containerRef}
    >
      <div
        // className={styles.title}
        onClick={() => window.dispatchEvent(new Event('trigger-glitter-bomb'))}
        style={{
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '3rem',
          fontWeight: '800',
          color: '#ffffff',
          opacity: 1,
          visibility: 'visible',
          lineHeight: 0.9,
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }
        }}
        aria-label="Click to trigger a glitter effect"
      >
        Disruption is a feature, <br /> not a bug.
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '1.5rem',
          color: '#ff00ff',
          marginTop: '1rem',
        }}
      >
        Not here to play nice. Just to play loud.
      </div>
    </div>
  );
}

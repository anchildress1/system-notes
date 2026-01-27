'use client';

import { useRef } from 'react';
import styles from './SitemapHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function SitemapHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef });

  return (
    <div className={styles.hero} ref={containerRef} role="banner" aria-label="Sitemap introduction">
      <div
        role="button"
        tabIndex={0}
        className={styles.interactiveContainer}
        onClick={() => window.dispatchEvent(new Event('trigger-glitter-bomb'))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }
        }}
      >
        <h1 className={styles.title}>
          <span className={styles.visuallyHidden}>Sitemap: </span>
          AI wanted this here
        </h1>
        <div className={styles.subtitle}>I didn&apos;t argue</div>
      </div>
    </div>
  );
}

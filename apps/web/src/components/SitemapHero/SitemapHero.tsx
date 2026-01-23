'use client';

import { useRef } from 'react';
import styles from './SitemapHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

export default function SitemapHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useSparkles({ containerRef });

  return (
    <div className={styles.hero} ref={containerRef} role="banner" aria-label="Sitemap introduction">
      <h1
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
        <span className={styles.visuallyHidden}>Sitemap: </span>
        AI wanted it to be here <br /> and I didn&apos;t argue.
      </h1>
    </div>
  );
}

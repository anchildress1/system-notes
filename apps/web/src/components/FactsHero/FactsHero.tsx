'use client';

import { useRef } from 'react';
import styles from '@/styles/SharedHero.module.css';
import heroStyles from './FactsHero.module.css';

export default function FactsHero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  const triggerGlow = () => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.remove(heroStyles.titleGlow);
    void el.offsetWidth;
    el.classList.add(heroStyles.titleGlow);
  };

  return (
    <div className={styles.hero}>
      <div className={styles.interactiveContainer}>
        <h1 className={styles.title} ref={titleRef}>
          Decisions on record
        </h1>
        <span className={styles.subtitle}>so you can audit me</span>
        <button
          type="button"
          className={styles.glitterTrigger}
          onClick={(e) => {
            triggerGlow();
            globalThis.dispatchEvent(
              new CustomEvent('trigger-glitter-bomb', {
                detail: { x: e.clientX, y: e.clientY },
              })
            );
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerGlow();
              globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
            }
          }}
          aria-label="Click to trigger a glitter effect"
        />
      </div>
    </div>
  );
}

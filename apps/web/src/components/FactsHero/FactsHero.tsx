'use client';

import { useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import styles from '@/styles/SharedHero.module.css';
import heroStyles from './FactsHero.module.css';

export default function FactsHero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  const triggerGlow = () => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.remove(heroStyles.titleGlow);
    el.getBoundingClientRect(); // force reflow so the glow animation restarts
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
          aria-label="Click to trigger a glitter effect"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            triggerGlow();
            globalThis.dispatchEvent(
              new CustomEvent('trigger-glitter-bomb', {
                detail: { x: event.clientX, y: event.clientY },
              })
            );
          }}
          onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              triggerGlow();
              globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
            }
          }}
        />
      </div>
    </div>
  );
}

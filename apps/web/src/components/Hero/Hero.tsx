'use client';

import { useRef, type ReactNode } from 'react';
import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  kicker?: string;
  accentLead?: string;
  titleAccent?: string;
  accentWord?: string;
  subtitle?: string;
  /** Optional media (e.g. a portrait) rendered beside the text as a split hero. */
  aside?: ReactNode;
}

export default function Hero({
  title,
  kicker,
  accentLead,
  titleAccent,
  accentWord,
  subtitle,
  aside,
}: Readonly<HeroProps>) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Cursor-follow spotlight: write mouse position (relative to the hero box)
  // into CSS custom properties. The transition on `--spot-x/--spot-y`
  // (declared in Hero.module.css via @property) creates the trailing-glow
  // effect. Raw DOM writes keep this off React's render path.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div className={styles.hero} ref={heroRef} onMouseMove={handleMouseMove}>
      <div className={`${styles.inner} ${aside ? styles.hasAside : ''}`}>
        <div className={styles.textCol}>
          <div className={styles.interactiveContainer}>
            {kicker && (
              <span className={styles.kicker}>
                <span className={styles.kickerDot} aria-hidden="true" />
                {kicker}
              </span>
            )}
            <h1 className={styles.title}>
              {accentLead && (
                <>
                  <span className={styles.rotatingWord}>{accentLead}</span>{' '}
                </>
              )}
              {title}
              {titleAccent && (
                <span className={styles.titleAccent}>
                  {titleAccent}
                  {accentWord && (
                    <>
                      {/* Non-breaking space keeps the colored word from wrapping
                          onto a line by itself. */}
                      {' '}
                      <span className={styles.rotatingWord}>{accentWord}</span>
                    </>
                  )}
                </span>
              )}
            </h1>
            <button
              type="button"
              className={styles.glitterTrigger}
              data-testid="hero-interactive"
              aria-label="Trigger glitter effect"
              onClick={(e) => {
                globalThis.dispatchEvent(
                  new CustomEvent('trigger-glitter-bomb', {
                    detail: { x: e.clientX, y: e.clientY },
                  })
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
                }
              }}
            />
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
    </div>
  );
}

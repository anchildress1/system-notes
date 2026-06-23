'use client';

import { useEffect, useRef, type ReactNode, type KeyboardEvent, type MouseEvent } from 'react';
import Kicker from '@/components/Kicker/Kicker';
import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  kicker?: string;
  accentLead?: string;
  titleAccent?: string;
  accentWord?: string;
  accentTone?: 'brand' | 'teal';
  subtitle?: string;
  /** Optional CTAs rendered under the subtitle. */
  actions?: ReactNode;
  /** Optional media (e.g. a portrait) rendered beside the text as a split hero. */
  aside?: ReactNode;
}

export default function Hero({
  title,
  kicker,
  accentLead,
  titleAccent,
  accentWord,
  accentTone = 'brand',
  subtitle,
  actions,
  aside,
}: Readonly<HeroProps>) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Cursor-follow spotlight: write mouse position (relative to the hero box)
  // into CSS custom properties. The transition on `--spot-x/--spot-y`
  // (declared in Hero.module.css via @property) creates the trailing-glow
  // effect. Attached imperatively — not a JSX handler — so this decorative
  // effect doesn't read as an interactive control, and raw DOM writes keep it
  // off React's render path.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={styles.hero} data-accent-tone={accentTone} ref={heroRef}>
      <div className={`${styles.inner} ${aside ? styles.hasAside : ''}`}>
        <div className={styles.textCol}>
          <div className={styles.interactiveContainer}>
            {kicker && <Kicker className={styles.kicker}>{kicker}</Kicker>}
            <h1 className={styles.title}>
              {accentLead && (
                <>
                  <span className={styles.rotatingWord}>{accentLead}</span>{' '}
                </>
              )}
              {title}
              {titleAccent && (
                <>
                  {' '}
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
                </>
              )}
            </h1>
            <button
              type="button"
              className={styles.glitterTrigger}
              data-testid="hero-interactive"
              aria-label="Trigger glitter effect"
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                globalThis.dispatchEvent(
                  new CustomEvent('trigger-glitter-bomb', {
                    detail: { x: event.clientX, y: event.clientY },
                  })
                );
              }}
              onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  globalThis.dispatchEvent(new CustomEvent('trigger-glitter-bomb'));
                }
              }}
            />
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>

        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
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
  actions?: ReactNode;
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

  // DOM writes keep the decorative cursor spotlight off React's render path.
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
      {/* .inner excludes the hero's padded gutters, so the full-box trigger stays its sibling. */}
      <button
        type="button"
        className={styles.glitterTrigger}
        data-testid="hero-interactive"
        aria-label="Trigger glitter effect"
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          const glitterEvent =
            event.clientX === 0 && event.clientY === 0
              ? new CustomEvent('trigger-glitter-bomb')
              : new CustomEvent('trigger-glitter-bomb', {
                  detail: { x: event.clientX, y: event.clientY },
                });
          globalThis.dispatchEvent(glitterEvent);
        }}
      />
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
                        {/* Keep the colored word from wrapping alone. */}
                        {' '}
                        <span className={styles.rotatingWord}>{accentWord}</span>
                      </>
                    )}
                  </span>
                </>
              )}
            </h1>
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>

        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
    </div>
  );
}

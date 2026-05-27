'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export default function Hero({ title, titleAccent, subtitle, image }: Readonly<HeroProps>) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  const triggerGlow = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.remove(styles.titleGlow);
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add(styles.titleGlow);
  }, []);

  return (
    <div className={styles.hero}>
      <div className={styles.titleContainer}>
        <div className={styles.interactiveContainer}>
          <h1 className={styles.title} ref={titleRef}>
            {title}
            {titleAccent && <span className={styles.titleAccent}>{titleAccent}</span>}
          </h1>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          <button
            type="button"
            className={styles.glitterTrigger}
            data-testid="hero-interactive"
            aria-label="Trigger glitter effect"
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
          />
        </div>
      </div>

      {image && (
        <div className={styles.imageContainer}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className={styles.image}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
    </div>
  );
}

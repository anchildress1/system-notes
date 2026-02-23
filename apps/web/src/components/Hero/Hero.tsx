'use client';

import { useRef } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

interface HeroProps {
  title: string;
  subtitle?: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export default function Hero({ title, subtitle, image }: Readonly<HeroProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Sparkle near text if there's an image to balance the visual weight
  useSparkles({ containerRef, textRef, sparkleNearText: !!image });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.titleContainer} ref={textRef}>
        <button
          type="button"
          className={styles.interactiveContainer}
          data-testid="hero-interactive"
          aria-label="Trigger glitter effect"
          onClick={() => {
            globalThis.dispatchEvent(new Event('trigger-glitter-bomb'));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              globalThis.dispatchEvent(new Event('trigger-glitter-bomb'));
            }
          }}
        >
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </button>
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

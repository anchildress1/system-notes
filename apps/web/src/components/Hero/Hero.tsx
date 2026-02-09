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

export default function Hero({ title, subtitle, image }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Sparkle near text if there's an image to balance the visual weight
  useSparkles({ containerRef, textRef, sparkleNearText: !!image });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.titleContainer} ref={textRef}>
        <div
          className={styles.interactiveContainer}
          data-testid="hero-interactive"
          role="button"
          tabIndex={0}
          aria-label="Trigger glitter effect"
          onClick={() => {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.dispatchEvent(new Event('trigger-glitter-bomb'));
            }
          }}
        >
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
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

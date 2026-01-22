'use client';

import { useRef } from 'react';
import Image from 'next/image';
import styles from './AboutHero.module.css';
import { useSparkles } from '@/hooks/useSparkles';

interface AboutHeroProps {
  title?: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export default function AboutHero({ title, image }: AboutHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // default image if not provided
  const heroImage = image || {
    src: '/ashley-gen-2.jpg',
    alt: 'Ashley Childress',
    width: 600,
    height: 400,
  };

  const heroTitle = title || "I design for the failure \n you haven't met yet.";

  // useSparkles({ containerRef, textRef, sparkleNearText: true });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.titleContainer} ref={textRef}>
        <div className={styles.title}>
          <span
            onClick={() => window.dispatchEvent(new Event('trigger-glitter-bomb'))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.dispatchEvent(new Event('trigger-glitter-bomb'));
              }
            }}
            tabIndex={0}
            role="button"
            style={{ cursor: 'pointer', display: 'inline-block' }}
          >
            {heroTitle.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < heroTitle.split('\n').length - 1 && <br />}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className={styles.imageContainer}>
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          width={heroImage.width}
          height={heroImage.height}
          className={styles.image}
          priority
        />
      </div>
    </div>
  );
}

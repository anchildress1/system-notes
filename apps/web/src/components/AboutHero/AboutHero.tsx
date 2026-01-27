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

  const heroTitle = title || "Designing for the failures \n you haven't met yet";
  const [mainTitle, subTitle] = heroTitle.split('\n').map((s) => s.trim());

  useSparkles({ containerRef, textRef, sparkleNearText: true });

  return (
    <div className={styles.hero} ref={containerRef}>
      <div className={styles.titleContainer} ref={textRef}>
        <div
          role="button"
          tabIndex={0}
          className={styles.interactiveContainer}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('trigger-glitter-bomb'));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('trigger-glitter-bomb'));
              }
            }
          }}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1 className={styles.title}>{mainTitle}</h1>
          {subTitle && <div className={styles.subtitle}>{subTitle}</div>}
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

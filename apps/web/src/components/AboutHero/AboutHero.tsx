'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './AboutHero.module.css';
import { Particle } from '../GlitterBomb/GlitterBomb';

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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const particles: Particle[] = [];

    const initPixi = async () => {
      // Disable interaction/animation on mobile
      if (window.innerWidth < 768) return;

      if (!containerRef.current) return;
      const PIXI = await import('pixi.js');

      app = new PIXI.Application();
      if (!containerRef.current) return;
      await app.init({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight, // Cover full hero area
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!containerRef.current) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      app.canvas.style.position = 'absolute';
      app.canvas.style.top = '0';
      app.canvas.style.left = '0';
      app.canvas.style.pointerEvents = 'none';

      app.ticker.add(() => {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= p.decay;

          if (p.life <= 0) {
            p.visible = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            app.stage.removeChild(p as any);
            particles.splice(i, 1);
          } else {
            p.x += Math.cos(p.direction) * p.speed;
            p.y += Math.sin(p.direction) * p.speed;
            p.speed *= 0.9;
            p.alpha = p.life;
            p.scale.x = p.life * 0.8;
            p.scale.y = p.life * 0.8;
          }
        }
      });
    };

    initPixi();

    const handleMouseMove = async (e: MouseEvent) => {
      if (!app || !containerRef.current || !textRef.current) return;

      // Only trigger sparks if hovering near the text
      const textRect = textRef.current.getBoundingClientRect();
      const isInText =
        e.clientX >= textRect.left &&
        e.clientX <= textRect.right &&
        e.clientY >= textRect.top &&
        e.clientY <= textRect.bottom;

      if (!isInText) return;

      const PIXI = await import('pixi.js');
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const count = 3;
      const colors = [0xff00ff, 0x00ffff, 0xffffff];

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particle = new PIXI.Graphics() as any as Particle;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.circle(0, 0, Math.random() * 1.5 + 0.5); // "Dust" size
        particle.fill(color);
        particle.x = x + (Math.random() - 0.5) * 20;
        particle.y = y + (Math.random() - 0.5) * 20;
        particle.alpha = 1;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;

        particle.direction = angle;
        particle.speed = velocity;
        particle.life = 1.0;
        particle.decay = Math.random() * 0.03 + 0.01; // Slower decay, matches Hero.tsx

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(particle as any);
        particles.push(particle);
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
      if (containerRef.current) {
        // eslint-disable-next-line
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div className={styles.hero} ref={containerRef}>
      <div
        className={styles.titleContainer}
        ref={textRef}
        onClick={() => window.dispatchEvent(new Event('trigger-glitter-bomb'))}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.dispatchEvent(new Event('trigger-glitter-bomb'));
          }
        }}
      >
        <div className={styles.title}>
          {heroTitle.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < heroTitle.split('\n').length - 1 && <br />}
            </span>
          ))}
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

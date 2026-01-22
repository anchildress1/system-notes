'use client';

import { useEffect, useRef } from 'react';
import styles from './SitemapHero.module.css';
import { Particle } from '../GlitterBomb/GlitterBomb';

export default function SitemapHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const particles: Particle[] = [];

    // Feature detect mobile for optimizations
    // "Mobile" here means small screen OR touch capability.
    // We assume embedded views might trigger the width check.
    const isMobile =
      typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);

    const initPixi = async () => {
      // Intentionally allowing initialization even on reduced motion/mobile, but with optimizations below.

      if (!containerRef.current) return;
      const PIXI = await import('pixi.js');
      if (!containerRef.current) return;

      // Create Pixi Application
      app = new PIXI.Application();
      await app.init({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundAlpha: 0,
        // Optimize resolution for mobile to save GPU (1x instead of Retina)
        resolution: isMobile ? 1 : window.devicePixelRatio || 1,
        autoDensity: true,
        // Disable antialias on mobile for performance
        antialias: !isMobile,
      });

      if (!containerRef.current) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      app.canvas.style.position = 'absolute';
      app.canvas.style.top = '0';
      app.canvas.style.left = '0';
      app.canvas.style.pointerEvents = 'none'; // Click through, but track JS mouse events on parent

      // Animation Loop
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
            p.speed *= 0.9; // Drag
            p.alpha = p.life;
            p.scale.x = p.life * 0.8; // Larger sparks
            p.scale.y = p.life * 0.8;
          }
        }
      });
    };

    initPixi();

    const handleMouseMove = async (e: MouseEvent) => {
      if (!app || !containerRef.current) return;
      const PIXI = await import('pixi.js');

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Spawn chaotic sparks
      // Reduce count on mobile to maintain FPS
      const count = isMobile ? 2 : 5;
      const colors = [0xff00ff, 0x00ffff, 0xffffff]; // Pink, Cyan, White

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particle = new PIXI.Graphics() as any as Particle;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Smaller particles on mobile
        const baseSize = isMobile ? 1 : 1.5;
        particle.circle(0, 0, Math.random() * baseSize + 0.5); // "Dust" size
        particle.fill(color);
        particle.x = x + (Math.random() - 0.5) * 20; // Jitter
        particle.y = y + (Math.random() - 0.5) * 20;
        particle.alpha = 1;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;

        particle.direction = angle;
        particle.speed = velocity;
        particle.life = 1.0;

        // Faster decay on mobile to clear buffer
        particle.decay = Math.random() * (isMobile ? 0.05 : 0.03) + 0.01;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(particle as any);
        particles.push(particle);
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    // Add touch support: treat touch moves as mouse moves to spawn sparkles
    const handleTouchMove = (e: TouchEvent) => {
      // Only trigger on mobile to avoid double events on some devices
      if (!isMobile) return;
      const touch = e.touches[0];
      // Create a fake MouseEvent structure for reuse
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
      if (containerRef.current) {
        // eslint-disable-next-line
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        // eslint-disable-next-line
        containerRef.current.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

  return (
    <div className={styles.hero} ref={containerRef} role="banner" aria-label="Sitemap introduction">
      <h1
        className={styles.title}
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
        <span className={styles.visuallyHidden}>Sitemap: </span>
        AI wanted it to be here <br /> and I didn&apos;t argue.
      </h1>
    </div>
  );
}

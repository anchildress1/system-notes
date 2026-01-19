'use client';

import { useEffect, useRef } from 'react';
import styles from './Hero.module.css';
import { Particle } from '../GlitterBomb/GlitterBomb';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const particles: Particle[] = [];

    const initPixi = async () => {
      // Disable interaction/animation on mobile
      if (window.innerWidth < 768) return;

      if (!containerRef.current) return;
      const PIXI = await import('pixi.js');

      // Create Pixi Application
      app = new PIXI.Application();
      await app.init({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
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
            p.scale.x = p.life * 0.5; // Smaller sparks
            p.scale.y = p.life * 0.5;
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
      const count = 3;
      const colors = [0xff00ff, 0x00ffff, 0xffffff]; // Pink, Cyan, White

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particle = new PIXI.Graphics() as any as Particle;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.circle(0, 0, Math.random() * 2 + 1);
        particle.fill(color);
        particle.x = x + (Math.random() - 0.5) * 20; // Jitter
        particle.y = y + (Math.random() - 0.5) * 20;
        particle.alpha = 1;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 5 + 2;

        particle.direction = angle;
        particle.speed = velocity;
        particle.life = 1.0;
        particle.decay = Math.random() * 0.05 + 0.02;

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
      <div className={styles.title}>
        Disruption is a feature, <br /> not a bug.
      </div>
      <div className={styles.subtitle}>Not here to play nice. Just to play loud.</div>
    </div>
  );
}

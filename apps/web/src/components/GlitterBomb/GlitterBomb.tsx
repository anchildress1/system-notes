'use client';

import { useEffect, useRef } from 'react';

// Define Particle interface locally
interface Particle {
  x: number;
  y: number;
  speed: number;
  direction: number;
  life: number; // Current life
  decay: number; // Fade speed
  // properties from PIXI.Graphics (partial)
  circle: (x: number, y: number, radius: number) => void;
  fill: (color: number) => void;
  alpha: number;
  scale: { x: number; y: number };
}

export default function GlitterBomb() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;

    const initPixi = async () => {
      const PIXI = await import('pixi.js');

      if (!containerRef.current) return;

      // Create Pixi Application with transparent background
      app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!containerRef.current) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);

      // --- Power Explosion Config ---
      const particles: Particle[] = [];
      const colors = [0xffd700, 0xffec8b, 0xffffff, 0xb56bff]; // Gold, Light Gold, White, Purple
      const particleCount = 200;

      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 3; // Explode from top-ish center

      for (let i = 0; i < particleCount; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const particle = new PIXI.Graphics() as any as Particle;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Initial Draw
        particle.circle(0, 0, Math.random() * 3 + 1); // Tiny particles
        particle.fill(color);

        // Start at center
        particle.x = centerX;
        particle.y = centerY;
        particle.alpha = 1;

        // Explosion Physics
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 10 + 4; // Much Faster/Bigger blast

        particle.direction = angle;
        particle.speed = velocity;
        particle.life = 1.0;
        particle.decay = Math.random() * 0.01 + 0.005; // Faster fade

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(particle as unknown as any);
        particles.push(particle);
      }

      // Animation Loop
      app.ticker.add(() => {
        let activeParticles = 0;

        particles.forEach((p) => {
          if (p.life > 0) {
            activeParticles++;

            // Move outward
            p.x += Math.cos(p.direction) * p.speed;
            p.y += Math.sin(p.direction) * p.speed;

            // Gravity / Drag
            p.speed *= 0.98; // Gentle drag
            p.y += 0.5; // Floaty gravity

            // Fade out
            p.life -= p.decay;
            p.alpha = p.life;
            p.scale.x = p.life;
            p.scale.y = p.life;
          } else {
            p.visible = false;
          }
        });

        // Stop ticker if done
        if (activeParticles === 0) {
          app.stop();
        }
      });
    };

    initPixi();

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';

// Define Particle interface locally
export interface Particle {
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
  visible: boolean;
}

export default function GlitterBomb() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = useRef<any>(null);

  useEffect(() => {
    const initPixi = async () => {
      // Check for mobile - disable if width < 768px
      if (window.innerWidth < 768) return;

      const PIXI = await import('pixi.js');

      if (!containerRef.current) return;

      // Create Pixi Application with transparent background
      const app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!containerRef.current) {
        app.destroy({ removeView: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Function to trigger explosion
      const trigger = () => {
        if (!app.ticker.started) app.start();

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

        // Animation Loop Logic (add to ticker if not already there, or just keep adding particles to existing ticker)
        // We can just add a ticker callback that cleans itself up or manages these specific particles
        const tick = () => {
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((p as any).parent) (p as any).parent.removeChild(p as any);
            }
          });

          if (activeParticles === 0) {
            app.ticker.remove(tick);
          }
        };
        app.ticker.add(tick);
      };

      // Trigger initial explosion
      trigger();

      // Listen for custom event
      window.addEventListener('trigger-glitter-bomb', trigger);

      // Cleanup listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._glitterCleanup = () => window.removeEventListener('trigger-glitter-bomb', trigger);
    };

    initPixi();

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any)._glitterCleanup) (window as any)._glitterCleanup();
      if (appRef.current) {
        appRef.current.destroy({ removeView: true });
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

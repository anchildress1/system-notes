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
      // Feature detect rather than just width check for better "lite" mode
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;

      // If mobile, use a much lighter config
      // If performance is still bad, we might need to resort to "if (isMobile) return;"

      const PIXI = await import('pixi.js');

      if (!containerRef.current) return;

      // Create Pixi Application
      const app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        resolution: isMobile ? 1 : window.devicePixelRatio || 1, // Force 1x resolution on mobile
        autoDensity: true,
        antialias: !isMobile, // Disable antialias on mobile
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

        // --- Optimized Explosion Config ---
        const particles: Particle[] = [];
        const colors = [0xffd700, 0xffec8b, 0xffffff, 0xb56bff];

        // Massive reduction for mobile
        const particleCount = isMobile ? 40 : 200;

        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 3;

        for (let i = 0; i < particleCount; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const particle = new PIXI.Graphics() as any as Particle;
          const color = colors[Math.floor(Math.random() * colors.length)];

          // Simpler layout for mobile
          particle.circle(0, 0, Math.random() * (isMobile ? 2 : 3) + 1);
          particle.fill(color);

          // Start at center
          particle.x = centerX;
          particle.y = centerY;
          particle.alpha = 1;

          // Explosion Physics
          const angle = Math.random() * Math.PI * 2;
          const velocity = Math.random() * (isMobile ? 8 : 10) + 4;

          particle.direction = angle;
          particle.speed = velocity;
          particle.life = 1.0;
          // Faster decay on mobile to clear buffer sooner
          particle.decay = Math.random() * (isMobile ? 0.03 : 0.01) + 0.005;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app.stage.addChild(particle as unknown as any);
          particles.push(particle);
        }

        const tick = () => {
          let activeParticles = 0;
          particles.forEach((p) => {
            if (p.life > 0) {
              activeParticles++;

              // Move
              p.x += Math.cos(p.direction) * p.speed;
              p.y += Math.sin(p.direction) * p.speed;

              // Simplified physics for mobile
              if (!isMobile) {
                p.speed *= 0.98; // Gentle drag
                p.y += 0.5; // Floaty gravity
              } else {
                p.speed *= 0.95; // Stronger drag to stop movement faster
              }

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
      (window as any)._glitterCleanup = () =>
        window.removeEventListener('trigger-glitter-bomb', trigger);
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

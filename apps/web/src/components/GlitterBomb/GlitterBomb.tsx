'use client';

import { useEffect, useRef } from 'react';

// Define Particle interface locally
import { Particle } from '@/types/sparkles';

export default function GlitterBomb() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = useRef<any>(null);

  useEffect(() => {
    const initPixi = async () => {
      // Feature detect rather than just width check for better "lite" mode
      const isMobile = globalThis.innerWidth < 768 || 'ontouchstart' in globalThis;

      // Disable entirely on mobile
      // feature flag logic removed per user request

      const PIXI = await import('pixi.js');

      if (!containerRef.current) return;

      // Create Pixi Application
      const app = new PIXI.Application();
      await app.init({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resizeTo: globalThis as any,
        backgroundAlpha: 0,
        resolution: isMobile ? 1 : globalThis.devicePixelRatio || 1, // Force 1x resolution on mobile
        autoDensity: true,
        antialias: false, // Always disable antialias for performance
        powerPreference: 'high-performance', // Hint to browser
      });

      if (!containerRef.current) {
        if (app.ticker) app.ticker.stop();
        app.destroy({ removeView: true });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Generate a simple circle texture to share across particles (BATCHING!)
      const circleGraphics = new PIXI.Graphics();
      circleGraphics.circle(0, 0, 4);
      circleGraphics.fill({ color: 0xffffff });
      const circleTexture = app.renderer.generateTexture(circleGraphics);

      // Shared mutable particle list — replaced on each explosion trigger
      const currentParticles: Particle[] = [];

      // Particle update extracted to avoid exceeding 4 function-nesting levels (S2004)
      const updateParticle = (p: Particle): boolean => {
        if (p.life > 0) {
          p.x += Math.cos(p.direction) * p.speed;
          p.y += Math.sin(p.direction) * p.speed;
          if (isMobile) {
            p.speed *= 0.95;
          } else {
            p.speed *= 0.98;
            p.y += 0.5;
          }
          p.life -= p.decay;
          p.alpha = p.life;
          p.scale.set(p.life * 0.5);
          return true;
        }
        p.visible = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p as any).remove?.();
        return false;
      };

      const tick = () => {
        let hasActive = false;
        for (const p of currentParticles) {
          if (updateParticle(p)) hasActive = true;
        }
        if (!hasActive) {
          app.ticker.remove(tick);
        }
      };

      // Function to trigger explosion
      const trigger = () => {
        if (!app.renderer) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (app._destroyed) return; // Safety check
        if (!app.ticker.started) app.start();

        // --- Optimized Explosion Config ---
        currentParticles.length = 0; // Reset shared particle list for new explosion
        const colors = [0xffd700, 0xffec8b, 0xffffff, 0xb56bff];

        // Massive reduction for mobile
        const particleCount = isMobile ? 30 : 150;

        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 3;

        for (let i = 0; i < particleCount; i++) {
          // Use Sprite instead of Graphics for immense performance boost (batching)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const particle = new PIXI.Sprite(circleTexture) as unknown as Particle;
          const color = colors[Math.floor(Math.random() * colors.length)]; // NOSONAR - visual randomness, not security-sensitive
          particle.tint = color; // Sprites use tint instead of fill

          // Center anchor for rotation/scaling
          particle.anchor.set(0.5);

          // Simpler layout for mobile
          const scaleStart = Math.random() * (isMobile ? 0.3 : 0.5) + 0.2; // NOSONAR - visual randomness
          particle.scale.set(scaleStart);

          // Start at center
          particle.x = centerX;
          particle.y = centerY;
          particle.alpha = 1;

          // Explosion Physics
          const angle = Math.random() * Math.PI * 2; // NOSONAR - visual randomness
          const velocity = Math.random() * (isMobile ? 8 : 10) + 4; // NOSONAR - visual randomness

          particle.direction = angle;
          particle.speed = velocity;
          particle.life = 1;
          // Faster decay on mobile to clear buffer sooner
          particle.decay = Math.random() * (isMobile ? 0.04 : 0.01) + 0.005; // NOSONAR - visual randomness

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app.stage.addChild(particle as any);
          currentParticles.push(particle);
        }

        app.ticker.add(tick);
      };

      // Trigger initial explosion - REMOVED for performance

      // Listen for custom event
      globalThis.addEventListener('trigger-glitter-bomb', trigger);

      // Cleanup listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)._glitterCleanup = () =>
        globalThis.removeEventListener('trigger-glitter-bomb', trigger);
    };

    // Delay initialization to improve LCP/TBT scores
    const timerId = setTimeout(initPixi, 3000);

    return () => {
      clearTimeout(timerId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((globalThis as any)._glitterCleanup) (globalThis as any)._glitterCleanup();
      if (appRef.current) {
        const app = appRef.current;
        if (app.ticker) app.ticker.stop();
        try {
          app.destroy({ removeView: true, children: true });
        } catch (e) {
          console.warn('GlitterBomb destroy error:', e);
        }
        appRef.current = null;
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

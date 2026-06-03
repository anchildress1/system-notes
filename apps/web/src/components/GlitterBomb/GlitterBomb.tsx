'use client';

import { useEffect, useRef } from 'react';

// Define Particle interface locally
import { Particle } from '@/types/sparkles';

export default function GlitterBomb() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = useRef<any>(null);

  useEffect(() => {
    // Feature detect rather than just width check for better "lite" mode
    const isMobile = globalThis.innerWidth < 768 || 'ontouchstart' in globalThis;

    let pendingExplosion: { x?: number; y?: number } | null = null;
    let triggerFn: ((x?: number, y?: number) => void) | null = null;

    // Register listener immediately — events fired during the init delay would
    // otherwise be silently lost.
    const onGlitterBomb = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x?: number; y?: number }>).detail ?? {};
      if (triggerFn) {
        triggerFn(x, y);
      } else {
        pendingExplosion = { x, y };
      }
    };
    globalThis.addEventListener('trigger-glitter-bomb', onGlitterBomb);

    const initPixi = async () => {
      try {
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
        circleGraphics.circle(0, 0, 8);
        circleGraphics.fill({ color: 0xffffff });
        const circleTexture = app.renderer.generateTexture(circleGraphics);

        // Shared mutable particle list — replaced on each explosion trigger
        const currentParticles: Particle[] = [];

        // The ticker is added once and self-removes when idle; this flag stops
        // duplicate listeners from stacking (which would multiply the per-frame
        // updates and make the explosion progressively faster).
        let tickRunning = false;

        // Glow that flashes at the click point and fades out. Reuses the
        // particle circle texture scaled up large and tinted; it grows and
        // fades over its short life (see the glow block in tick).
        const glow = new PIXI.Sprite(circleTexture);
        glow.anchor.set(0.5);
        glow.tint = 0xb56bff; // brand violet
        glow.visible = false;
        app.stage.addChild(glow);
        let glowLife = 0;
        const GLOW_DECAY = 0.02; // ~0.8s lifespan at 60fps

        // Particle update extracted to avoid exceeding 4 function-nesting levels (S2004)
        const updateParticle = (p: Particle, dt: number): boolean => {
          if (p.life > 0) {
            p.x += Math.cos(p.direction) * p.speed * dt;
            p.y += Math.sin(p.direction) * p.speed * dt;
            if (isMobile) {
              p.speed *= Math.pow(0.95, dt);
            } else {
              p.speed *= Math.pow(0.98, dt);
              p.y += 0.5 * dt;
            }
            p.life -= p.decay * dt;
            p.alpha = p.life;
            p.scale.set(p.life * 0.5);
            return true;
          }
          p.visible = false;
          p.removeFromParent();
          return false;
        };

        const tick = () => {
          // deltaTime is ~1 at the target frame rate; scaling every step by it
          // keeps the explosion playing at the same speed on any display and
          // under load, instead of tracking the current FPS.
          const dt = app.ticker.deltaTime;

          let hasActive = false;
          for (const p of currentParticles) {
            if (updateParticle(p, dt)) hasActive = true;
          }

          if (glowLife > 0) {
            glowLife -= GLOW_DECAY * dt;
            if (glowLife <= 0) {
              glow.visible = false;
            } else {
              glow.alpha = glowLife;
              glow.scale.set(7 + (1 - glowLife) * 14);
            }
          }

          if (hasActive || glowLife > 0) return;
          app.ticker.remove(tick);
          tickRunning = false;
        };

        // Function to trigger explosion at mouse position (or screen center fallback)
        const trigger = (mouseX?: number, mouseY?: number) => {
          if (!app.renderer) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((app as any)._destroyed) return; // Safety check - _destroyed is a private PIXI internal // NOSONAR(S4325)
          if (!app.ticker.started) app.start();

          // Remove any lingering particles from the stage before reusing the list
          for (const p of currentParticles) {
            p.removeFromParent();
          }
          currentParticles.length = 0;

          // --- Optimized Explosion Config ---
          const colors = [0xf16197, 0xb56bff, 0x3ec7c2, 0xe89a6a, 0xffffff];

          // Massive reduction for mobile
          const particleCount = isMobile ? 30 : 150;

          const centerX = mouseX ?? app.screen.width / 2;
          const centerY = mouseY ?? app.screen.height / 3;

          // Flash a brief glow at the click point — it lights up, then fades.
          glow.x = centerX;
          glow.y = centerY;
          glow.tint = 0xb56bff; // brand violet
          glow.alpha = 1;
          glow.scale.set(7);
          glow.visible = true;
          glowLife = 1;

          for (let i = 0; i < particleCount; i++) {
            // Use Sprite instead of Graphics for immense performance boost (batching)
            const particle = new PIXI.Sprite(circleTexture) as unknown as Particle;
            const color = colors[Math.floor(Math.random() * colors.length)]; // NOSONAR(S2245) - visual randomness, not security-sensitive
            particle.tint = color; // Sprites use tint instead of fill

            // Center anchor for rotation/scaling
            particle.anchor.set(0.5);

            // Simpler layout for mobile
            const scaleStart = Math.random() * (isMobile ? 0.3 : 0.5) + 0.2; // NOSONAR(S2245) - visual randomness
            particle.scale.set(scaleStart);

            // Start at center
            particle.x = centerX;
            particle.y = centerY;
            particle.alpha = 1;

            // Explosion Physics
            const angle = Math.random() * Math.PI * 2; // NOSONAR(S2245) - visual randomness
            const velocity = Math.random() * (isMobile ? 4 : 5) + 2; // NOSONAR(S2245) - visual randomness

            particle.direction = angle;
            particle.speed = velocity;
            particle.life = 1;
            // Faster decay on mobile to clear buffer sooner
            particle.decay = Math.random() * (isMobile ? 0.04 : 0.01) + 0.005; // NOSONAR(S2245) - visual randomness

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            app.stage.addChild(particle as any);
            currentParticles.push(particle);
          }

          if (!tickRunning) {
            app.ticker.add(tick);
            tickRunning = true;
          }
        };

        // Wire up trigger and fire any event that arrived during init
        triggerFn = trigger;
        if (pendingExplosion !== null) {
          const { x, y } = pendingExplosion;
          pendingExplosion = null;
          trigger(x, y);
        }
      } catch (err) {
        console.warn('GlitterBomb: failed to initialize Pixi:', err);
      }
    };

    // Delay initialization to improve LCP/TBT scores
    const timerId = setTimeout(initPixi, 1500);

    return () => {
      clearTimeout(timerId);
      globalThis.removeEventListener('trigger-glitter-bomb', onGlitterBomb);
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

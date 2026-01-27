import { useEffect, useRef } from 'react';
import { Particle } from '@/types/sparkles';

interface UseSparklesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  textRef?: React.RefObject<HTMLDivElement | null>;
  sparkleOnHover?: boolean; // If true, sparkles spawn on mouse move over container
  sparkleNearText?: boolean; // If true, sparkles only spawn when hovering near specific text
}

export const useSparkles = ({
  containerRef,
  textRef,
  sparkleOnHover = true,
  sparkleNearText = false,
}: UseSparklesOptions) => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let circleTexture: any;

    const particles: Particle[] = [];
    let isObserverPaused = false;
    let isMounted = true; // Track mount status to prevent leaks/crashes

    // Feature detect mobile for optimizations
    const isMobile =
      typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);

    // Completely disable sparkles on mobile for maximum performance
    if (isMobile) return;

    const initPixi = async () => {
      try {
        if (!containerRef.current || !isMounted) return;
        const PIXI = await import('pixi.js');
        // Re-check after async import
        if (!containerRef.current || !isMounted) return;

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
          antialias: false,
          powerPreference: 'high-performance',
        });

        if (!containerRef.current || !isMounted) {
          // Stop ticker before destroy if init happened partially
          if (app.ticker) app.ticker.stop();
          app.destroy({ removeView: true, children: true });
          return;
        }

        containerRef.current.appendChild(app.canvas);
        app.canvas.style.position = 'absolute';
        app.canvas.style.top = '0';
        app.canvas.style.left = '0';
        app.canvas.style.pointerEvents = 'none';

        // Generate texture for Sprites
        // Safety check: ensure renderer exists
        if (!app.renderer) return;

        const circleGraphics = new PIXI.Graphics();
        circleGraphics.circle(0, 0, 4);
        circleGraphics.fill({ color: 0xffffff });

        try {
          circleTexture = app.renderer.generateTexture(circleGraphics);
        } catch (e) {
          console.warn('Failed to generate texture:', e);
          return;
        }

        // Animation Loop Function
        const animate = () => {
          if (isObserverPaused || !isMounted) return;
          // Critical check: ensure app and renderer exist before attempting any render or update
          if (!app || !app.renderer || !app.stage) return;

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
              p.scale.set(p.life * 0.4);
            }
          }
        };

        // Add ticker with named function so we can remove it explicitly?
        // Actually app.destroy() handles ticker, but let's be safe.
        app.ticker.add(animate);
      } catch (err) {
        console.error('Failed to initialize Pixi:', err);
      }
    };

    // Use simple setTimeout for lazy load to avoid requestIdleCallback instability
    // Delay longer on mobile to avoid blocking main thread during initial load (improves Lighthouse Performance)
    const timeoutId = setTimeout(initPixi, 100);

    // Intersection Observer to pause rendering when out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isObserverPaused = !entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const handleInteraction = async (clientX: number, clientY: number) => {
      // Early check
      if (!app || !app.renderer || !containerRef.current || !isMounted) return;

      try {
        // If restricted to text area (like in AboutHero)
        if (sparkleNearText && textRef?.current) {
          const textRect = textRef.current.getBoundingClientRect();
          const isInText =
            clientX >= textRect.left &&
            clientX <= textRect.right &&
            clientY >= textRect.top &&
            clientY <= textRect.bottom;

          if (!isInText) return;
        }

        const PIXI = await import('pixi.js');
        // Re-check EVERYTHING after async await
        if (!isMounted || !app || !app.renderer || !circleTexture) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Reduce count on mobile to maintain FPS
        const count = isMobile ? 2 : 5;
        const colors = [0xff00ff, 0x00ffff, 0xffffff]; // Pink, Cyan, White

        for (let i = 0; i < count; i++) {
          // Double check app state and texture
          if (!app.renderer || !circleTexture) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const particle = new PIXI.Sprite(circleTexture) as any as Particle;
          const color = colors[Math.floor(Math.random() * colors.length)];

          particle.tint = color;
          particle.anchor.set(0.5);

          // Smaller particles on mobile
          const baseScale = isMobile ? 0.2 : 0.4;
          particle.scale.set(Math.random() * baseScale + 0.1);

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
      } catch (err) {
        console.error('Sparkle interaction error:', err);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (sparkleOnHover) {
        handleInteraction(e.clientX, e.clientY);
      }
    };

    // Add touch support: treat touch moves as mouse moves to spawn sparkles
    const handleTouchMove = (e: TouchEvent) => {
      // Only trigger on mobile to avoid double events on some devices
      if (!isMobile) return;
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      try {
        if (app) {
          if (app.ticker) app.ticker.stop();

          try {
            // PIXI v8 destruction - use options object
            app.destroy({
              removeView: true,
              children: true,
              texture: true,
              baseTexture: true,
            });
          } catch (e) {
            console.warn('PIXI destroy error:', e);
          }
          app = null;
          circleTexture = null;
        }
      } catch (err) {
        console.warn('Failed to destroy Pixi app:', err);
      }
      observer.disconnect();
      if (containerRef.current) {
        // eslint-disable-next-line
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        // eslint-disable-next-line
        containerRef.current.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [containerRef, textRef, sparkleOnHover, sparkleNearText]);
};

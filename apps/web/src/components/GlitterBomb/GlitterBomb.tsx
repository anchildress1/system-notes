'use client';

import { useEffect } from 'react';

// Pink, teal, violet, amber — the brand palette.
const SPARKLE_COLORS = ['#f16197', '#3ec7c2', '#b56bff', '#e89a6a'];

// Glittery burst at the click point: a ring of small glowing dots that fly
// outward and fade. Driven by the Web Animations API, so the duration is
// wall-clock based — the burst plays at the same speed on any display.
function spawnSparkles(x: number, y: number, count = 18) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    const color = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3; // NOSONAR(S2245) - visual randomness
    const dist = 60 + Math.random() * 120; // NOSONAR(S2245) - visual randomness
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    Object.assign(el.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: '6px',
      height: '6px',
      borderRadius: '99px',
      background: color,
      boxShadow: `0 0 8px ${color}`, // the glow
      pointerEvents: 'none',
      zIndex: '200',
    });

    el.animate(
      [
        { transform: 'translate(0, 0) scale(0)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx * 1.2}px, ${dy * 1.2}px) scale(0)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' } // NOSONAR(S2245)
    );

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}

export default function GlitterBomb() {
  useEffect(() => {
    const prefersReducedMotion = globalThis.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const onTrigger = (e: Event) => {
      if (prefersReducedMotion) return;
      const { x, y } = (e as CustomEvent<{ x?: number; y?: number }>).detail ?? {};
      spawnSparkles(x ?? globalThis.innerWidth / 2, y ?? globalThis.innerHeight / 3);
    };

    globalThis.addEventListener('trigger-glitter-bomb', onTrigger);
    return () => globalThis.removeEventListener('trigger-glitter-bomb', onTrigger);
  }, []);

  return null;
}

import { describe, it, expect } from 'vitest';
import type { Particle } from './GlitterBomb';

describe('GlitterBomb Types', () => {
  it('Particle interface should support visible property', () => {
    // This test primarily serves as a compile-time check.
    // If Particle definition lacks 'visible', this file will fail to compile/lint.
    const p: Partial<Particle> = {
      visible: true,
    };

    // Runtime check (though type check is the main goal)
    expect(p.visible).toBe(true);
  });
});

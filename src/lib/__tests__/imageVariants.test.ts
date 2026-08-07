import { describe, it, expect, vi } from 'vitest';

vi.mock('@/data/image-manifest.json', () => ({
  default: {
    '/projects/alpha.webp': { blur: 'data:image/webp;base64,ALPHA', widths: [448, 896, 1344] },
    // Capped below the top rung, as happens when the source is narrower than the ladder.
    '/beta.webp': { blur: 'data:image/webp;base64,BETA', widths: [448, 888] },
  },
}));

const { projectImageLoader, blurFor } = await import('@/lib/imageVariants');

describe('projectImageLoader', () => {
  it('rewrites a nested source to the matching variant', () => {
    expect(projectImageLoader({ src: '/projects/alpha.webp', width: 448 })).toBe(
      '/projects/opt/alpha-448.webp'
    );
  });

  it('rewrites a root-level source without doubling the slash', () => {
    expect(projectImageLoader({ src: '/beta.webp', width: 448 })).toBe('/opt/beta-448.webp');
  });

  it('rounds up to the smallest rung that covers the requested width', () => {
    expect(projectImageLoader({ src: '/projects/alpha.webp', width: 500 })).toBe(
      '/projects/opt/alpha-896.webp'
    );
  });

  it('returns the exact rung when the request lands on one', () => {
    expect(projectImageLoader({ src: '/projects/alpha.webp', width: 896 })).toBe(
      '/projects/opt/alpha-896.webp'
    );
  });

  it('clamps to the widest rung when the source ran out of pixels', () => {
    expect(projectImageLoader({ src: '/beta.webp', width: 1344 })).toBe('/opt/beta-888.webp');
  });

  it('passes through an unmanaged source untouched', () => {
    expect(projectImageLoader({ src: '/system-notes-icon-v2.svg', width: 448 })).toBe(
      '/system-notes-icon-v2.svg'
    );
  });
});

describe('blurFor', () => {
  it('returns the placeholder for a managed source', () => {
    expect(blurFor('/projects/alpha.webp')).toBe('data:image/webp;base64,ALPHA');
  });

  it('returns undefined for an unmanaged source', () => {
    expect(blurFor('/nope.webp')).toBeUndefined();
  });

  it('returns undefined when no source is given', () => {
    expect(blurFor(undefined)).toBeUndefined();
  });
});

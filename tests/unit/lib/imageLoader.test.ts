import { describe, expect, it, vi } from 'vitest';

const projectImageLoader = vi.fn(() => '/projects/opt/alpha-896.webp');

vi.mock('@/lib/imageVariants', () => ({ projectImageLoader }));

const { default: imageLoader } = await import('@/lib/imageLoader');

describe('imageLoader', () => {
  it('forwards Next image requests to the shared variant resolver', () => {
    const request = { src: '/projects/alpha.webp', width: 896 };

    expect(imageLoader(request)).toBe('/projects/opt/alpha-896.webp');
    expect(projectImageLoader).toHaveBeenCalledWith(request);
  });
});

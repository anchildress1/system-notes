import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

beforeEach(() => vi.resetModules());
afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
  else process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
});

describe('sitemap', () => {
  it('lists every indexable page against the configured origin', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.example/';
    const sitemap = (await import('./sitemap')).default();
    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://staging.example/',
      'https://staging.example/choices',
      'https://staging.example/human',
    ]);
  });

  it('rejects a base URL containing a path', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.example/path';
    const buildSitemap = (await import('./sitemap')).default;
    expect(() => buildSitemap()).toThrow('NEXT_PUBLIC_BASE_URL');
  });
});

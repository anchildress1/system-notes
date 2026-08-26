import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const noteHarness = vi.hoisted(() => ({ getIndexableNoteIds: vi.fn() }));

vi.mock('@/lib/notes', () => ({
  getIndexableNoteIds: () => noteHarness.getIndexableNoteIds(),
}));

beforeEach(() => {
  vi.resetModules();
  noteHarness.getIndexableNoteIds.mockReset();
  noteHarness.getIndexableNoteIds.mockResolvedValue(['card:test:1']);
});
afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
  else process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
});

describe('sitemap', () => {
  it('lists every indexable page against the configured origin', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.example/';
    const sitemap = await (await import('@/app/sitemap')).default();
    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://staging.example/',
      'https://staging.example/notes',
      'https://staging.example/projects',
      'https://staging.example/about',
      'https://staging.example/notes/card%3Atest%3A1',
    ]);
  });

  it('keeps the public routes when the note index is unavailable', async () => {
    noteHarness.getIndexableNoteIds.mockResolvedValue([]);
    const sitemap = await (await import('@/app/sitemap')).default();

    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://anchildress1.dev/',
      'https://anchildress1.dev/notes',
      'https://anchildress1.dev/projects',
      'https://anchildress1.dev/about',
    ]);
  });

  it('rejects a base URL containing a path', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.example/path';
    const buildSitemap = (await import('@/app/sitemap')).default;
    await expect(buildSitemap()).rejects.toThrow('NEXT_PUBLIC_BASE_URL');
  });
});

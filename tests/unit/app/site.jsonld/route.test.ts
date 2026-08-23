import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  getProjects: vi.fn(() => [
    {
      id: 'a',
      title: 'Alpha',
      status: '',
      description: 'd',
      purpose: '',
      long_description: '',
      outcome: '',
      tech: [],
      owner: 'x',
    },
  ]),
}));

const load = async () => (await import('@/app/site.jsonld/route')).GET();

const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

beforeEach(() => vi.resetModules());
afterEach(() => {
  if (ORIGINAL_BASE_URL === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
  else process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL_BASE_URL;
});

describe('GET /site.jsonld', () => {
  it('serves the linked-data content type crawlers look for', async () => {
    const res = await load();
    expect(res.headers.get('Content-Type')).toBe('application/ld+json');
  });

  it('sends a revalidating cache header rather than pinning the document', async () => {
    const res = await load();
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate');
  });

  it('emits parseable schema.org JSON containing the projects', async () => {
    const body = JSON.parse(await (await load()).text());
    expect(body['@context']).toBe('https://schema.org');
    expect(body.hasPart.map((p: { name: string }) => p.name)).toEqual(['Alpha']);
  });

  it('honours NEXT_PUBLIC_BASE_URL when set', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.example';
    const body = JSON.parse(await (await load()).text());
    expect(body.url).toBe('https://staging.example');
  });

  it('falls back to the production host when the env var is absent', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const body = JSON.parse(await (await load()).text());
    expect(body.url).toBe('https://anchildress1.dev');
  });
});

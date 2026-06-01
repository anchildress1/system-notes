import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';

const SITEMAP_URL = 'https://crawly.checkmarkdevtools.dev/sitemap.xml';
const HOST = 'https://crawly.checkmarkdevtools.dev';

type RawResponse = { ok: boolean; text: () => Promise<string> };
const mkResp = (body: string, ok = true): RawResponse => ({ ok, text: async () => body });

const buildSitemap = (urls: string[]): string =>
  `<urlset>${urls.map((u) => `<loc>${u}</loc>`).join('')}</urlset>`;

const articleHtml = (opts: {
  headline: string;
  description: string;
  keywords?: string[];
  date?: string;
  id: string;
  readingTime?: string;
}): string => {
  const jsonLd = JSON.stringify({
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    keywords: opts.keywords ?? [],
    datePublished: opts.date ?? '2026-01-01',
    mainEntityOfPage: { '@id': opts.id },
  });
  const meta = opts.readingTime ? `<meta name="reading-time" content="${opts.readingTime}">` : '';
  return `<html><head><script type="application/ld+json">${jsonLd}</script>${meta}</head></html>`;
};

// Builds a fetch mock: serves the sitemap for SITEMAP_URL and resolves each
// post URL through htmlFor. Returning null from htmlFor yields a 404.
const mockFetch = (sitemapXml: string, htmlFor: (url: string) => string | null) =>
  vi.fn(async (url: string | URL): Promise<RawResponse> => {
    const u = url.toString();
    if (u === SITEMAP_URL) return mkResp(sitemapXml);
    const html = htmlFor(u);
    return html === null ? mkResp('', false) : mkResp(html);
  });

const makeRequest = (query = ''): NextRequest =>
  ({ nextUrl: new URL(`https://localhost/api/blog/search${query}`) }) as NextRequest;

// Module-level blogCache persists across GET calls, so reset modules per test
// to start each case with a cold cache.
const loadRoute = async () => (await import('./route')).GET;

describe('GET /api/blog/search', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns up to 3 results by default and reports the unfiltered total', async () => {
    const urls = ['a', 'b', 'c', 'd'].map((s) => `${HOST}/posts/${s}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) => {
        const slug = u.split('/').at(-1)!;
        return articleHtml({
          headline: `Post ${slug}`,
          description: 'body',
          id: u,
          date: `2026-01-0${slug.length}`,
        });
      })
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.results).toHaveLength(3);
    expect(body.total).toBe(4);
    expect(body.query).toBeNull();
  });

  it('clamps limit above 50 down to 50', async () => {
    const urls = Array.from({ length: 60 }, (_, i) => `${HOST}/posts/p${i}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        articleHtml({ headline: 'P', description: 'body', id: u })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?limit=100'));
    const body = await res.json();

    expect(body.results).toHaveLength(50);
    expect(body.total).toBe(60);
  });

  it('clamps limit below 1 up to 1', async () => {
    const urls = ['a', 'b', 'c'].map((s) => `${HOST}/posts/${s}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        articleHtml({ headline: 'P', description: 'body', id: u })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?limit=0'));
    const body = await res.json();

    expect(body.results).toHaveLength(1);
  });

  it('falls back to limit 3 when the param is non-numeric', async () => {
    const urls = ['a', 'b', 'c', 'd', 'e'].map((s) => `${HOST}/posts/${s}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        articleHtml({ headline: 'P', description: 'body', id: u })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?limit=abc'));
    const body = await res.json();

    expect(body.results).toHaveLength(3);
  });

  it('filters by query across title, blurb, and tags', async () => {
    const urls = ['alpha', 'beta'].map((s) => `${HOST}/posts/${s}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        u.endsWith('/alpha')
          ? articleHtml({
              headline: 'Alpha Post',
              description: 'about react',
              keywords: ['react'],
              id: u,
            })
          : articleHtml({
              headline: 'Beta Post',
              description: 'about vue',
              keywords: ['vue'],
              id: u,
            })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?q=react'));
    const body = await res.json();

    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe('Alpha Post');
    expect(body.query).toBe('react');
    expect(body.total).toBe(1);
  });

  it('filters by tag', async () => {
    const urls = ['alpha', 'beta'].map((s) => `${HOST}/posts/${s}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        u.endsWith('/alpha')
          ? articleHtml({ headline: 'Alpha Post', description: 'x', keywords: ['react'], id: u })
          : articleHtml({ headline: 'Beta Post', description: 'y', keywords: ['vue'], id: u })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?tag=vue'));
    const body = await res.json();

    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe('Beta Post');
  });

  it('does not fetch post URLs from a host other than the sitemap host (SSRF guard)', async () => {
    const urls = [`${HOST}/posts/safe`, 'https://evil.example.com/posts/pwn'];
    const fetchMock = mockFetch(buildSitemap(urls), (u) =>
      articleHtml({ headline: 'Safe', description: 'body', id: u })
    );
    vi.stubGlobal('fetch', fetchMock);

    const GET = await loadRoute();
    const res = await GET(makeRequest());
    const body = await res.json();

    const fetchedUrls = fetchMock.mock.calls.map((c) => c[0]!.toString());
    expect(fetchedUrls).not.toContain('https://evil.example.com/posts/pwn');
    expect(body.total).toBe(1);
    expect(body.results[0].title).toBe('Safe');
  });

  it('serves cached posts on the second call without re-fetching the sitemap', async () => {
    const urls = [`${HOST}/posts/a`];
    const fetchMock = mockFetch(buildSitemap(urls), (u) =>
      articleHtml({ headline: 'A', description: 'body', id: u })
    );
    vi.stubGlobal('fetch', fetchMock);

    const GET = await loadRoute();
    await GET(makeRequest());
    await GET(makeRequest());

    const sitemapCalls = fetchMock.mock.calls.filter((c) => c[0]!.toString() === SITEMAP_URL);
    expect(sitemapCalls).toHaveLength(1);
  });

  it('returns an empty result set when the sitemap has no post URLs', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap([]), () => null)
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest('?q=anything'));
    const body = await res.json();

    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('skips posts whose page returns a non-ok response', async () => {
    const urls = [`${HOST}/posts/ok`, `${HOST}/posts/missing`];
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (u) =>
        u.endsWith('/missing') ? null : articleHtml({ headline: 'OK', description: 'body', id: u })
      )
    );

    const GET = await loadRoute();
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.total).toBe(1);
    expect(body.results[0].title).toBe('OK');
  });
});

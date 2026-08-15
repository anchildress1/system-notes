import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const SITEMAP_URL = 'https://crawly.checkmarkdevtools.dev/sitemap.xml';
const HOST = 'https://crawly.checkmarkdevtools.dev';

const response = (body: string, status = 200, headers?: HeadersInit) =>
  new Response(body, { status, headers });

const buildSitemap = (urls: string[]): string =>
  `<urlset>${urls.map((url) => `<loc>${url}</loc>`).join('')}</urlset>`;

const articleHtml = (options: {
  headline?: unknown;
  description?: unknown;
  keywords?: unknown;
  date?: unknown;
  id?: unknown;
  readingTime?: string;
  type?: string;
}): string => {
  const jsonLd = JSON.stringify({
    '@type': options.type ?? 'Article',
    headline: options.headline ?? 'Post',
    description: options.description ?? 'Body',
    keywords: options.keywords ?? [],
    datePublished: options.date ?? '2026-01-01',
    mainEntityOfPage: { '@id': options.id ?? 'https://dev.to/anchildress1/post' },
  });
  const meta = options.readingTime
    ? `<meta content="${options.readingTime}" name="reading-time">`
    : '';
  return `<html><head><script data-schema type="application/ld+json">${jsonLd}</script>${meta}</head></html>`;
};

const mockFetch = (sitemapXml: string, htmlFor: (url: string) => string | null) =>
  vi.fn(async (input: string | URL | Request): Promise<Response> => {
    const url = input.toString();
    if (url === SITEMAP_URL) return response(sitemapXml);
    const html = htmlFor(url);
    return html === null ? response('', 404) : response(html);
  });

const makeRequest = (query = ''): NextRequest =>
  ({ nextUrl: new URL(`https://localhost/api/blog/search${query}`) }) as NextRequest;

const loadRoute = async () => (await import('./route')).GET;
const requestBody = async (query = '') => {
  const GET = await loadRoute();
  return (await GET(makeRequest(query))).json();
};

describe('GET /api/blog/search', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('returns three results by default and reports the total', async () => {
    const urls = ['a', 'b', 'c', 'd'].map((slug) => `${HOST}/posts/${slug}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) =>
        articleHtml({ headline: `Post ${url.split('/').at(-1)}`, id: url })
      )
    );

    const body = await requestBody();
    expect(body.results).toHaveLength(3);
    expect(body.total).toBe(4);
    expect(body.query).toBeNull();
  });

  it('caps sitemap work and result limits at 50 posts', async () => {
    const urls = Array.from({ length: 60 }, (_, index) => `${HOST}/posts/p${index}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) => articleHtml({ id: url }))
    );

    const body = await requestBody('?limit=100');
    expect(body.results).toHaveLength(50);
    expect(body.total).toBe(50);
  });

  it.each([
    { value: '0', expected: 1 },
    { value: 'abc', expected: 3 },
    { value: '2.5', expected: 3 },
    { value: '999999999999999999999999', expected: 3 },
  ])('normalizes limit $value', async ({ value, expected }) => {
    const urls = Array.from({ length: 5 }, (_, index) => `${HOST}/posts/p${index}`);
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) => articleHtml({ id: url }))
    );

    const body = await requestBody(`?limit=${value}`);
    expect(body.results).toHaveLength(expected);
  });

  it('filters case-insensitively across text and tags', async () => {
    const urls = [`${HOST}/posts/alpha`, `${HOST}/posts/beta`];
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) =>
        url.endsWith('/alpha')
          ? articleHtml({ headline: 'Alpha', description: 'about React', keywords: ['frontend'] })
          : articleHtml({ headline: 'Beta', description: 'about Vue', keywords: ['framework'] })
      )
    );

    const body = await requestBody('?q=react');
    expect(body.results.map((item: { title: string }) => item.title)).toEqual(['Alpha']);
    expect(body.total).toBe(1);
  });

  it('filters by a normalized tag and trims the returned query', async () => {
    const urls = [`${HOST}/posts/alpha`, `${HOST}/posts/beta`];
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) =>
        articleHtml({
          headline: url.endsWith('/alpha') ? 'Alpha' : 'Beta',
          keywords: url.endsWith('/alpha') ? 'React, TypeScript' : ['Vue'],
        })
      )
    );

    const GET = await loadRoute();
    const tagged = await (await GET(makeRequest('?tag=typescript'))).json();
    const queried = await (await GET(makeRequest('?q=%20Alpha%20'))).json();
    expect(tagged.results.map((item: { title: string }) => item.title)).toEqual(['Alpha']);
    expect(queried.query).toBe('Alpha');
  });

  it('bounds query strings before filtering and returning them', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap([]), () => null)
    );
    const query = 'a'.repeat(500);
    const body = await requestBody(`?q=${query}`);
    expect(body.query).toHaveLength(200);
  });

  it.each([
    'https://evil.example.com/posts/pwn',
    'https://crawly.checkmarkdevtools.dev.evil.example/posts/pwn',
    'http://crawly.checkmarkdevtools.dev/posts/insecure',
    'https://crawly.checkmarkdevtools.dev:444/posts/port',
    `${HOST}/not-posts/pwn`,
  ])('rejects unallowlisted sitemap URL %s', async (unsafeUrl) => {
    const safeUrl = `${HOST}/posts/safe`;
    const fetchMock = mockFetch(buildSitemap([safeUrl, unsafeUrl]), (url) =>
      articleHtml({ headline: 'Safe', id: url })
    );
    vi.stubGlobal('fetch', fetchMock);

    const body = await requestBody();
    expect(fetchMock.mock.calls.map(([input]) => input.toString())).not.toContain(unsafeUrl);
    expect(body.results.map((item: { title: string }) => item.title)).toEqual(['Safe']);
  });

  it('does not follow redirects from either upstream request', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(init?.redirect).toBe('manual');
      return input.toString() === SITEMAP_URL
        ? response(buildSitemap([`${HOST}/posts/redirect`]))
        : response('', 302, { location: 'https://evil.example/pwn' });
    });
    vi.stubGlobal('fetch', fetchMock);

    const body = await requestBody();
    expect(body.results).toEqual([]);
  });

  it.each([
    { target: 'sitemap', size: 1_000_001 },
    { target: 'post', size: 2_000_001 },
  ])('rejects oversized $target responses', async ({ target, size }) => {
    const postUrl = `${HOST}/posts/large`;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (input.toString() === SITEMAP_URL) {
        return target === 'sitemap'
          ? response('', 200, { 'content-length': String(size) })
          : response(buildSitemap([postUrl]));
      }
      return response('', 200, { 'content-length': String(size) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const body = await requestBody();
    expect(body.results).toEqual([]);
  });

  it('falls back to the fetched URL when JSON-LD supplies an unsafe public URL', async () => {
    const postUrl = `${HOST}/posts/safe`;
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap([postUrl]), () => articleHtml({ id: 'javascript:alert(1)' }))
    );

    const body = await requestBody();
    expect(body.results[0].url).toBe(postUrl);
  });

  it('accepts BlogPosting data nested in an @graph', async () => {
    const postUrl = `${HOST}/posts/graph`;
    const html = `<script type="application/ld+json">${JSON.stringify({
      '@graph': [
        { '@type': 'Organization', name: 'Publisher' },
        { '@type': 'BlogPosting', headline: 'Graph Post', description: 'Body' },
      ],
    })}</script>`;
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap([postUrl]), () => html)
    );

    const body = await requestBody();
    expect(body.results[0].title).toBe('Graph Post');
  });

  it('skips malformed pages while returning valid posts', async () => {
    const urls = [`${HOST}/posts/good`, `${HOST}/posts/bad`, `${HOST}/posts/missing`];
    vi.stubGlobal(
      'fetch',
      mockFetch(buildSitemap(urls), (url) => {
        if (url.endsWith('/bad')) return '<script type="application/ld+json">not-json</script>';
        if (url.endsWith('/missing')) return null;
        return articleHtml({ headline: 'Good', id: url });
      })
    );

    const body = await requestBody();
    expect(body.results.map((item: { title: string }) => item.title)).toEqual(['Good']);
  });

  it('serves cached posts without refetching', async () => {
    const fetchMock = mockFetch(buildSitemap([`${HOST}/posts/a`]), (url) =>
      articleHtml({ headline: 'A', id: url })
    );
    vi.stubGlobal('fetch', fetchMock);

    const GET = await loadRoute();
    await GET(makeRequest());
    await GET(makeRequest());
    expect(fetchMock.mock.calls.filter(([input]) => input.toString() === SITEMAP_URL)).toHaveLength(
      1
    );
  });

  it('coalesces concurrent cold-cache requests', async () => {
    let releaseSitemap: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseSitemap = resolve;
    });
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (input.toString() === SITEMAP_URL) {
        await gate;
        return response(buildSitemap([]));
      }
      return response('', 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const GET = await loadRoute();
    const first = GET(makeRequest());
    const second = GET(makeRequest());
    releaseSitemap?.();
    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

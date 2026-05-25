import { NextRequest, NextResponse } from 'next/server';

interface BlogPost {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  url?: string;
  tags: string[];
  projects: string[];
  category: string;
  signal: number;
}

interface BlogPostInternal extends BlogPost {
  url: string;
  published_date?: string;
  reading_time?: string;
}

interface BlogSearchResponse {
  results: BlogPost[];
  total: number;
  query: string | null;
}

const CRAWLY_SITEMAP_URL = 'https://crawly.checkmarkdevtools.dev/sitemap.xml';
const CACHE_TTL_MS = 15 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 60 * 1000;

let blogCache: { data: BlogPostInternal[]; expires: number } | null = null;

async function fetchSitemapUrls(): Promise<string[]> {
  try {
    const response = await fetch(CRAWLY_SITEMAP_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    const text = await response.text();
    return [...text.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
      .map((m) => m[1])
      .filter((url) => url.includes('/posts/'));
  } catch {
    return [];
  }
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const pattern = /<script type="application\/ld\+json">\s*(\{[^<]+\})\s*<\/script>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      if (data['@type'] === 'Article') return data;
    } catch {
      continue;
    }
  }
  return null;
}

function extractMetaContent(html: string, name: string): string | undefined {
  const idx = html.indexOf(`name="${name}"`);
  if (idx === -1) return undefined;
  return /content="([^"]*)"/.exec(html.slice(idx, idx + 200))?.[1];
}

async function fetchPostContent(url: string): Promise<BlogPostInternal | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const html = await response.text();
    const jsonLd = extractJsonLd(html);
    if (!jsonLd) return null;

    const slug = url.split('/').at(-1)?.replace('.html', '') ?? '';
    let keywords = jsonLd['keywords'] ?? [];
    if (typeof keywords === 'string') {
      keywords = (keywords as string).split(',').map((k: string) => k.trim());
    }

    const description = (jsonLd['description'] as string) ?? '';
    const mainEntity = jsonLd['mainEntityOfPage'] as Record<string, unknown> | undefined;
    const finalUrl = (mainEntity?.['@id'] as string) ?? url;

    return {
      objectID: 'blog:' + slug,
      title: (jsonLd['headline'] as string) ?? '',
      blurb: description,
      fact: description,
      tags: keywords as string[],
      projects: ['DEV Blog'],
      category: 'Blog',
      signal: 3,
      url: finalUrl,
      published_date: jsonLd['datePublished'] as string | undefined,
      reading_time: extractMetaContent(html, 'reading-time'),
    };
  } catch {
    return null;
  }
}

async function getAllBlogPosts(): Promise<BlogPostInternal[]> {
  const now = Date.now();
  if (blogCache && now < blogCache.expires) {
    return blogCache.data;
  }

  const urls = await fetchSitemapUrls();
  const results = await Promise.all(urls.map(fetchPostContent));
  const posts = results
    .filter((p): p is BlogPostInternal => p !== null)
    .sort((a, b) => (b.published_date ?? '').localeCompare(a.published_date ?? ''));

  blogCache = {
    data: posts,
    expires: now + (posts.length > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS),
  };
  return posts;
}

export async function GET(request: NextRequest): Promise<NextResponse<BlogSearchResponse>> {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');
  const tag = searchParams.get('tag');
  const rawLimit = parseInt(searchParams.get('limit') ?? '3', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 3;

  let posts = await getAllBlogPosts();

  if (q) {
    const qLower = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.blurb.toLowerCase().includes(qLower) ||
        p.fact.toLowerCase().includes(qLower) ||
        p.tags.some((t) => t.toLowerCase().includes(qLower))
    );
  }

  if (tag) {
    const tagLower = tag.toLowerCase();
    posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase().includes(tagLower)));
  }

  return NextResponse.json({
    results: posts.slice(0, limit),
    total: posts.length,
    query: q,
  });
}

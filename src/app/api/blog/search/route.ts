import { NextRequest, NextResponse } from 'next/server';
import { isSafeExternalUrl } from '@/lib/urlSafety';

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

type JsonObject = Record<string, unknown>;

const CRAWLY_SITEMAP_URL = 'https://crawly.checkmarkdevtools.dev/sitemap.xml';
const ALLOWED_ORIGIN = new URL(CRAWLY_SITEMAP_URL).origin;
const POST_PATH_PREFIX = '/posts/';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_SITEMAP_BYTES = 1_000_000;
const MAX_POST_BYTES = 2_000_000;
const MAX_POST_URLS = 50;
const POST_FETCH_CONCURRENCY = 5;
const MAX_FILTER_LENGTH = 200;
const CACHE_TTL_MS = 15 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 60 * 1000;

let blogCache: { data: BlogPostInternal[]; expires: number } | null = null;
let blogFetchInFlight: Promise<BlogPostInternal[]> | null = null;

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isAllowedPostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.origin === ALLOWED_ORIGIN &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith(POST_PATH_PREFIX)
    );
  } catch {
    return false;
  }
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string | null> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  if (!response.body) {
    const text = await response.text();
    return new TextEncoder().encode(text).byteLength <= maxBytes ? text : null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

async function fetchText(url: string, maxBytes: number): Promise<string | null> {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return readBoundedText(response, maxBytes);
}

async function fetchSitemapUrls(): Promise<string[]> {
  try {
    const xml = await fetchText(CRAWLY_SITEMAP_URL, MAX_SITEMAP_BYTES);
    if (!xml) return [];

    const urls = new Set<string>();
    for (const match of xml.matchAll(/<loc>\s*(https?:\/\/[^<]+?)\s*<\/loc>/gi)) {
      const url = match[1].replaceAll('&amp;', '&');
      if (isAllowedPostUrl(url)) urls.add(url);
      if (urls.size === MAX_POST_URLS) break;
    }
    return [...urls];
  } catch {
    return [];
  }
}

function findArticle(value: unknown): JsonObject | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const article = findArticle(item);
      if (article) return article;
    }
    return null;
  }
  if (!isJsonObject(value)) return null;

  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((item) => item === 'Article' || item === 'BlogPosting')) return value;
  return findArticle(value['@graph']);
}

function extractJsonLd(html: string): JsonObject | null {
  const pattern = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const article = findArticle(JSON.parse(match[1]));
      if (article) return article;
    } catch {
      continue;
    }
  }
  return null;
}

function extractReadingTime(html: string): string | undefined {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/\bname=["']reading-time["']/i.test(tag)) continue;
    return /\bcontent=["']([^"']*)["']/i.exec(tag)?.[1];
  }
  return undefined;
}

function stringValue(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function keywordValues(value: unknown): string[] {
  let values: unknown[] = [];
  if (typeof value === 'string') values = value.split(',');
  else if (Array.isArray(value)) values = value;

  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 50);
}

function articleUrl(jsonLd: JsonObject, fallback: string): string {
  const mainEntity = jsonLd['mainEntityOfPage'];
  let candidate: string | undefined;
  if (typeof mainEntity === 'string') candidate = mainEntity;
  else if (isJsonObject(mainEntity)) candidate = stringValue(mainEntity['@id'], 2_000);

  return isSafeExternalUrl(candidate) ? candidate : fallback;
}

async function fetchPostContent(url: string): Promise<BlogPostInternal | null> {
  try {
    const html = await fetchText(url, MAX_POST_BYTES);
    if (!html) return null;
    const jsonLd = extractJsonLd(html);
    if (!jsonLd) return null;

    const title = stringValue(jsonLd['headline'], 500);
    if (!title) return null;
    const description = stringValue(jsonLd['description'], 5_000) ?? '';
    const slug =
      new URL(url).pathname
        .split('/')
        .findLast((segment) => segment.length > 0)
        ?.replace(/\.html$/, '') ?? '';

    return {
      objectID: `blog:${slug}`,
      title,
      blurb: description,
      fact: description,
      tags: keywordValues(jsonLd['keywords']),
      projects: ['DEV Blog'],
      category: 'Blog',
      signal: 3,
      url: articleUrl(jsonLd, url),
      published_date: stringValue(jsonLd['datePublished'], 100),
      reading_time: extractReadingTime(html),
    };
  } catch {
    return null;
  }
}

async function fetchPosts(urls: string[]): Promise<BlogPostInternal[]> {
  const posts: BlogPostInternal[] = [];
  for (let index = 0; index < urls.length; index += POST_FETCH_CONCURRENCY) {
    const batch = await Promise.all(
      urls.slice(index, index + POST_FETCH_CONCURRENCY).map(fetchPostContent)
    );
    posts.push(...batch.filter((post): post is BlogPostInternal => post !== null));
  }
  return posts;
}

async function refreshBlogPosts(): Promise<BlogPostInternal[]> {
  const posts = (await fetchPosts(await fetchSitemapUrls())).sort((a, b) =>
    (b.published_date ?? '').localeCompare(a.published_date ?? '')
  );
  blogCache = {
    data: posts,
    expires: Date.now() + (posts.length > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS),
  };
  return posts;
}

async function getAllBlogPosts(): Promise<BlogPostInternal[]> {
  if (blogCache && Date.now() < blogCache.expires) return blogCache.data;
  if (blogFetchInFlight !== null) return blogFetchInFlight;

  const request = refreshBlogPosts();
  blogFetchInFlight = request;
  try {
    return await request;
  } finally {
    if (blogFetchInFlight === request) blogFetchInFlight = null;
  }
}

function filterValue(value: string | null): string | null {
  const normalized = value?.trim().slice(0, MAX_FILTER_LENGTH);
  return normalized || null;
}

function parseLimit(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 3;
  const limit = Number(value);
  return Number.isSafeInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 3;
}

export async function GET(request: NextRequest): Promise<NextResponse<BlogSearchResponse>> {
  const { searchParams } = request.nextUrl;
  const q = filterValue(searchParams.get('q'));
  const tag = filterValue(searchParams.get('tag'));
  const limit = parseLimit(searchParams.get('limit'));
  let posts = await getAllBlogPosts();

  if (q) {
    const query = q.toLocaleLowerCase();
    posts = posts.filter(
      (post) =>
        post.title.toLocaleLowerCase().includes(query) ||
        post.blurb.toLocaleLowerCase().includes(query) ||
        post.fact.toLocaleLowerCase().includes(query) ||
        post.tags.some((value) => value.toLocaleLowerCase().includes(query))
    );
  }

  if (tag) {
    const query = tag.toLocaleLowerCase();
    posts = posts.filter((post) =>
      post.tags.some((value) => value.toLocaleLowerCase().includes(query))
    );
  }

  return NextResponse.json({
    results: posts.slice(0, limit),
    total: posts.length,
    query: q,
  });
}

export const DEFAULT_BASE_URL = 'https://anchildress1.dev';

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: string | undefined): value is string {
  if (!value) return false;
  const url = parseUrl(value);
  return url?.protocol === 'https:' && url.username === '' && url.password === '';
}

export function getSafeHostname(value: string | undefined): string | null {
  return isSafeExternalUrl(value) ? new URL(value).hostname : null;
}

export function resolveBaseUrl(value = process.env.NEXT_PUBLIC_BASE_URL): string {
  const candidate = value?.trim() || DEFAULT_BASE_URL;
  const url = parseUrl(candidate);
  const isLocalHttp =
    url?.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  if (
    !url ||
    (!isLocalHttp && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search ||
    url.hash
  ) {
    throw new Error('NEXT_PUBLIC_BASE_URL must be an HTTPS origin or a local HTTP origin.');
  }

  return url.origin;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', String.raw`\u003c`);
}

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BASE_URL,
  getSafeHostname,
  isSafeExternalUrl,
  resolveBaseUrl,
  serializeJsonLd,
} from './urlSafety';

describe('URL safety', () => {
  it('accepts HTTPS URLs without credentials', () => {
    expect(isSafeExternalUrl('https://dev.to/anchildress1/post')).toBe(true);
    expect(getSafeHostname('https://dev.to/anchildress1/post')).toBe('dev.to');
  });

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'https://user:password@example.com',
    'not a url',
  ])('rejects unsafe external URL %s', (value) => {
    expect(isSafeExternalUrl(value)).toBe(false);
    expect(getSafeHostname(value)).toBeNull();
  });

  it('normalizes a configured base URL to its origin', () => {
    expect(resolveBaseUrl('https://staging.example/')).toBe('https://staging.example');
    expect(resolveBaseUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('uses the production origin when the setting is absent', () => {
    expect(resolveBaseUrl(undefined)).toBe(DEFAULT_BASE_URL);
  });

  it.each([
    'http://example.com',
    'https://example.com/path',
    'https://example.com?query=1',
    'https://user:password@example.com',
  ])('rejects invalid base URL %s', (value) => {
    expect(() => resolveBaseUrl(value)).toThrow('NEXT_PUBLIC_BASE_URL');
  });

  it('escapes markup that could terminate an inline JSON-LD script', () => {
    const serialized = serializeJsonLd({ value: '</script><script>alert(1)</script>' });
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual({ value: '</script><script>alert(1)</script>' });
  });
});

import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { parseTheme, THEME_COLORS, THEME_SCRIPT, THEME_STORAGE_KEY } from '@/lib/theme';

describe('parseTheme', () => {
  it('accepts the two literals and nothing else', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
  });

  it('rejects anything a corrupted or stale store could hold', () => {
    // Whatever comes back from storage is untrusted: another origin, an older
    // build, or a reader editing it by hand can all put something else there.
    for (const value of [null, undefined, '', 'Dark', 'LIGHT', 'system', 0, 1, {}, []]) {
      expect(parseTheme(value), String(value)).toBeNull();
    }
  });
});

describe('THEME_SCRIPT', () => {
  it('cannot throw out of a blocking head script', () => {
    // localStorage is a SecurityError in Safari private mode and in a sandboxed
    // frame. An uncaught throw here leaves a blank document, so the whole body
    // has to sit inside a catch.
    expect(THEME_SCRIPT).toMatch(/^\(function\(\)\{try\{/);
    expect(THEME_SCRIPT).toMatch(/\}catch\(e\)\{\}\}\)\(\);$/);
  });

  it('keeps its locals inside an IIFE rather than on window', () => {
    expect(THEME_SCRIPT.startsWith('(function(){')).toBe(true);
  });

  it('writes the theme to the document element and nowhere else', () => {
    // <html suppressHydrationWarning> covers exactly one element's own
    // attributes. Writing anywhere else surfaces as a mismatch React cannot be
    // told to ignore.
    expect(THEME_SCRIPT).toContain("document.documentElement.setAttribute('data-theme'");
    expect(THEME_SCRIPT).not.toContain('document.body');
  });

  it('carries the storage key and both chrome colors it has to apply', () => {
    expect(THEME_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(THEME_SCRIPT).toContain(THEME_COLORS.light);
    expect(THEME_SCRIPT).toContain(THEME_COLORS.dark);
  });

  it.each([
    { stored: 'dark', prefersLight: true, expected: 'dark' },
    { stored: 'light', prefersLight: false, expected: 'light' },
    { stored: null, prefersLight: true, expected: 'light' },
    { stored: 'blue', prefersLight: false, expected: 'dark' },
    { stored: 'blue', prefersLight: true, expected: 'light' },
  ])(
    'stamps $expected for stored $stored when the system prefers light: $prefersLight',
    ({ stored, prefersLight, expected }) => {
      const setDocumentTheme = vi.fn();

      runInNewContext(THEME_SCRIPT, {
        localStorage: { getItem: () => stored },
        matchMedia: (query: string) => ({
          matches: prefersLight && query === '(prefers-color-scheme: light)',
        }),
        document: {
          documentElement: { setAttribute: setDocumentTheme },
          querySelector: () => null,
        },
      });

      expect(setDocumentTheme).toHaveBeenCalledWith('data-theme', expected);
    }
  );

  it('still applies a light system preference when storage is unavailable', () => {
    const setDocumentTheme = vi.fn();
    const setThemeColor = vi.fn();
    const storageFailure = new DOMException('Storage is unavailable', 'SecurityError');

    expect(() =>
      runInNewContext(THEME_SCRIPT, {
        localStorage: {
          getItem: () => {
            throw storageFailure;
          },
        },
        matchMedia: (query: string) => ({
          matches: query === '(prefers-color-scheme: light)',
        }),
        document: {
          documentElement: { setAttribute: setDocumentTheme },
          querySelector: (selector: string) =>
            selector === 'meta[name="theme-color"]' ? { setAttribute: setThemeColor } : null,
        },
      })
    ).not.toThrow();

    expect(setDocumentTheme).toHaveBeenCalledWith('data-theme', 'light');
    expect(setThemeColor).toHaveBeenCalledWith('content', THEME_COLORS.light);
  });
});

describe('THEME_COLORS', () => {
  it('states a six-digit hex per theme, which is all browser chrome accepts', () => {
    expect(THEME_COLORS.dark).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEME_COLORS.light).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEME_COLORS.dark).not.toBe(THEME_COLORS.light);
  });
});

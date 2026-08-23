import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  parseTheme,
  resolveTheme,
  THEME_COLORS,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
} from '@/lib/theme';

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

describe('resolveTheme', () => {
  it('prefers a stored choice over the system preference', () => {
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('light');
    expect(resolveTheme(null, false)).toBe('dark');
  });

  it('treats an unusable stored value as no value at all', () => {
    expect(resolveTheme('purple', true)).toBe('light');
    expect(resolveTheme('purple', false)).toBe(DEFAULT_THEME);
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

  it('carries the storage key and both chrome colours it has to apply', () => {
    expect(THEME_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(THEME_SCRIPT).toContain(THEME_COLORS.light);
    expect(THEME_SCRIPT).toContain(THEME_COLORS.dark);
  });

  it('accepts only the two literals out of storage', () => {
    expect(THEME_SCRIPT).toContain("s==='dark'||s==='light'");
  });

  it('reads the system preference when storage has nothing usable', () => {
    expect(THEME_SCRIPT).toContain('prefers-color-scheme: light');
  });
});

describe('THEME_COLORS', () => {
  it('states a six-digit hex per theme, which is all browser chrome accepts', () => {
    expect(THEME_COLORS.dark).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEME_COLORS.light).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEME_COLORS.dark).not.toBe(THEME_COLORS.light);
  });
});

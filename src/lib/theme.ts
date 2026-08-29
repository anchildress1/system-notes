/** The two themes the site renders, and the value stamped on `<html>`. */
export type Theme = 'dark' | 'light';

/** Where the reader's choice is kept between visits. */
export const THEME_STORAGE_KEY = 'system-notes-theme';

/** What the server renders, and what a reader without a stored choice falls back to. */
export const DEFAULT_THEME: Theme = 'dark';

/** sRGB renderings of --void, for the browser chrome that cannot read a token. */
export const THEME_COLORS: Readonly<Record<Theme, string>> = {
  dark: '#0b0c0f',
  light: '#f7f6f2',
};

/**
 * Narrows an unknown stored value to a theme.
 *
 * @param value Anything read out of storage or an attribute.
 * @returns The theme, or null when the value is not one of the two literals.
 */
export function parseTheme(value: unknown): Theme | null {
  return value === 'dark' || value === 'light' ? value : null;
}

/**
 * Picks the theme to render from a stored choice and the system preference.
 *
 * @param stored A previously stored value, if any.
 * @param prefersLight Whether the OS asks for a light interface.
 * @returns The stored choice when it is valid, otherwise the system preference.
 */
export function resolveTheme(stored: unknown, prefersLight: boolean): Theme {
  return parseTheme(stored) ?? (prefersLight ? 'light' : DEFAULT_THEME);
}

/**
 * The script that stamps the theme onto `<html>` before the first paint.
 *
 * Runs synchronously in `<head>`, so it must not throw: `localStorage` is a
 * SecurityError in Safari private mode and inside a sandboxed frame, and an
 * uncaught throw in a blocking head script leaves a blank document. It touches
 * `<html>` and the theme-color meta and nothing else — `suppressHydrationWarning`
 * on `<html>` covers exactly one element's own attributes, so writing anywhere
 * else would surface as a hydration mismatch React cannot be told to ignore.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var t=(s==='dark'||s==='light')?s:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
document.documentElement.setAttribute('data-theme',t);
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute('content',t==='light'?${JSON.stringify(THEME_COLORS.light)}:${JSON.stringify(THEME_COLORS.dark)});
}catch(e){}})();`;

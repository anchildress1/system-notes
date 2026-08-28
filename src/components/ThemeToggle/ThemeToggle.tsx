'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import {
  DEFAULT_THEME,
  parseTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme';
import styles from './ThemeToggle.module.css';

/** Notifies every mounted toggle when one of them changes the theme. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme(): Theme {
  return parseTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME;
}

/**
 * The server has no way to know the reader's theme — the inline head script
 * resolves it — so the server snapshot is the same value the CSS defaults to.
 * Returning anything else would make the first client render disagree with the
 * markup React is hydrating.
 */
function serverTheme(): Theme {
  return DEFAULT_THEME;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage is unavailable in Safari private mode and sandboxed frames.
      // The theme still applies for this page; it just will not be remembered.
    }
    for (const listener of listeners) listener();
  }, []);

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={theme === 'light'}
      aria-label="Light theme"
      onClick={toggle}
    >
      {/* Both icons are always in the DOM and CSS picks by [data-theme]. Choosing
          in JS would either disagree with the server-rendered markup or flash the
          wrong icon on the first paint. */}
      <FiSun className={styles.sun} aria-hidden="true" />
      <FiMoon className={styles.moon} aria-hidden="true" />
    </button>
  );
}

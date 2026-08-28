import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { THEME_COLORS, THEME_STORAGE_KEY } from '@/lib/theme';

const control = () => screen.getByRole('button', { name: 'Light theme' });

function themeColorMeta() {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', THEME_COLORS.dark);
  document.head.append(meta);
  return meta;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.head.querySelector('meta[name="theme-color"]')?.remove();
  });

  it('reports the theme already stamped on the document', () => {
    document.documentElement.dataset.theme = 'light';

    render(<ThemeToggle />);

    expect(control()).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls back to dark when the document carries no theme yet', () => {
    // The server cannot know the reader's theme, so it renders the CSS default.
    // Reporting anything else here would disagree with the markup being hydrated.
    render(<ThemeToggle />);

    expect(control()).toHaveAttribute('aria-pressed', 'false');
  });

  it('treats an unrecognised attribute value as the default', () => {
    document.documentElement.dataset.theme = 'sepia';

    render(<ThemeToggle />);

    expect(control()).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the document theme and remembers the choice', () => {
    render(<ThemeToggle />);

    fireEvent.click(control());

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(control()).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches back again', () => {
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle />);

    fireEvent.click(control());

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('repaints the browser chrome, which cannot read a custom property', () => {
    const meta = themeColorMeta();
    render(<ThemeToggle />);

    fireEvent.click(control());

    expect(meta.getAttribute('content')).toBe(THEME_COLORS.light);
  });

  it('still applies the theme when storage refuses to hold it', () => {
    // Safari private mode and sandboxed frames throw on setItem. The choice is
    // simply not remembered; it must not take the toggle down with it.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    render(<ThemeToggle />);

    expect(() => fireEvent.click(control())).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('renders both icons so the server never has to pick one', () => {
    // Choosing in JS would either disagree with the server-rendered markup or
    // flash the wrong icon on first paint; CSS picks by [data-theme] instead.
    const { container } = render(<ThemeToggle />);

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons).toHaveLength(2);
  });
});

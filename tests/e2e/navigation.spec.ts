import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Skip link', () => {
  const skipLink = (page: import('@playwright/test').Page) =>
    page.getByRole('link', { name: 'Skip to main content' });

  // Measured through getBoundingClientRect, not Playwright's boundingBox: the
  // latter is not viewport-relative here, so an assertion built on it passed
  // against the broken build and proved nothing.
  const geometry = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const link = document.querySelector('header a[href="#main-content"]')!;
      const header = document.querySelector('header')!;
      const inner = document.querySelector('header > div')!;
      return {
        clearance: -link.getBoundingClientRect().bottom,
        top: link.getBoundingClientRect().top,
        headerHeight: header.getBoundingClientRect().height,
        innerHeight: inner.getBoundingClientRect().height,
      };
    });

  // `.btn[data-variant='filled']` sets `position: relative` at (0,2,0) and beat
  // the `position: fixed` on .skipLink at (0,1,0), so the link kept a line box
  // in the sticky header — 51px of empty band above the nav.
  test('does not take up space in the header it is parked above', async ({ page }) => {
    await page.goto('/');
    const { headerHeight, innerHeight } = await geometry(page);

    expect(headerHeight, 'header is taller than its content').toBeLessThanOrEqual(innerHeight + 2);
  });

  // Parked 29px above the fold, an elastic overscroll at the top of the page
  // dragged it back into view and snapped it away — visible, then gone, every
  // time the page reached the top.
  test('parks far enough above the fold to survive an overscroll', async ({ page }) => {
    await page.goto('/');
    const { clearance } = await geometry(page);

    expect(clearance, 'skip link is parked too close to the fold').toBeGreaterThan(64);
  });

  test('comes back on screen when it takes focus', async ({ page }) => {
    await page.goto('/');
    await skipLink(page).focus();

    expect((await geometry(page)).top).toBeGreaterThanOrEqual(0);
  });

  // The reveal above is CSS and runs everywhere. Tab ORDER is asserted on one
  // engine because WebKit only moves focus to a link when the reader has turned
  // that on in the OS — a browser preference, not something this page controls.
  test('is the first thing a Tab reaches', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not tab to links by default');
    await page.goto('/');

    await page.keyboard.press('Tab');

    await expect(skipLink(page)).toBeFocused();
  });
});

test.describe('Primary navigation', () => {
  test('grounds the intake in shipped work', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Senior Software Engineer.')).toBeVisible();
    await expect(page.getByText(/cites only systems I’ve actually shipped/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the evidence.' })).toHaveAttribute(
      'href',
      '/projects'
    );
  });

  test('moves between the intake, exhibits, index, and about', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await nav.getByRole('link', { name: 'what I’ve shipped' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(nav.getByRole('link', { name: 'what I’ve shipped' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await nav.getByRole('link', { name: 'how I decide' }).click();
    await expect(page).toHaveURL('/notes');
    await expect(nav.getByRole('link', { name: 'how I decide' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await nav.getByRole('link', { name: 'about me' }).click();
    await expect(page).toHaveURL('/about');
    await expect(nav.getByRole('link', { name: 'about me' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await nav.getByRole('link', { name: 'ask me a question' }).click();
    await expect(page).toHaveURL('/');
  });

  test('keeps the blog external and exposes profile destinations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /blog/i })).toHaveAttribute(
      'href',
      'https://dev.to/anchildress1'
    );
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /LinkedIn/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /DEV/i })).toBeVisible();
  });
});

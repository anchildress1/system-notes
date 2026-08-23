import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Primary navigation', () => {
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

  test('carries an old index deep link across to its new home', async ({ page }) => {
    // The hash never reaches the server, so its survival is browser behaviour
    // rather than something the redirect rule can state. Assert it, don't assume it.
    await page.goto('/?project=System+Notes#notes-index');

    // Next re-encodes the space as %20 on the way through, so assert what it
    // actually emits rather than the + the old links were written with.
    await expect(page).toHaveURL('/notes?project=System%20Notes#notes-index');
  });

  test('leaves the intake its own ?q= rather than redirecting it away', async ({ page }) => {
    await page.goto('/?q=anything');

    await expect(page).toHaveURL('/?q=anything');
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

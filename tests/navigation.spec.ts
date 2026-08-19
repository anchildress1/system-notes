import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Primary navigation', () => {
  test('moves between the index, exhibits, and about', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await nav.getByRole('link', { name: 'exhibits' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(nav.getByRole('link', { name: 'exhibits' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await nav.getByRole('link', { name: 'about' }).click();
    await expect(page).toHaveURL('/about');
    await expect(nav.getByRole('link', { name: 'about' })).toHaveAttribute('aria-current', 'page');

    await nav.getByRole('link', { name: 'the index' }).click();
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

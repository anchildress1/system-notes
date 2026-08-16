import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Primary navigation', () => {
  test('moves between Index, Projects, and About', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await nav.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(nav.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await nav.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');

    await nav.getByRole('link', { name: 'Index' }).click();
    await expect(page).toHaveURL('/');
  });

  test('keeps Writing external and exposes profile destinations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Writing/i })).toHaveAttribute(
      'href',
      'https://dev.to/anchildress1'
    );
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /LinkedIn/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /DEV/i })).toBeVisible();
  });
});

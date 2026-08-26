import { expect } from '@playwright/test';
import { test } from './utils';

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

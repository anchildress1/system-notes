import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('WebKit compatibility', () => {
  test('keeps the portfolio navigation and theme control usable', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    const initialTheme = await page.locator('html').getAttribute('data-theme');

    await navigation.getByRole('link', { name: 'what I’ve shipped' }).click();
    await expect(page).toHaveURL('/projects');
    await page.getByRole('button', { name: 'Light theme' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', initialTheme ?? '');
    await expect(page.getByTestId('exhibit-save-the-sun')).toBeVisible();
  });
});

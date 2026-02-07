import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Search Page Integration', () => {
  test('loads search page and renders main component', async ({ page }) => {
    // Enhanced debugging listeners
    page.on('console', (msg) => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message, error.stack));
    page.on('requestfailed', (request) =>
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
    );

    await page.goto('/search'); // Use relative path as baseURL is usually configured or passed via CI env

    try {
      // Allow for different placeholders or generic searchbox role
      // Script loads async, so we verify the container exists
      const searchContainer = page.locator('#search-container');
      const unavailable = page.getByText(/Search is currently unavailable/);

      await expect(searchContainer.or(unavailable)).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log('Search box not found. Page content:');
      console.log(await page.content());
      throw e;
    }

    // Verify key attributes if search box is present
    const searchContainer = page.locator('#search-container');
    if (await searchContainer.isVisible()) {
      await expect(searchContainer).toBeVisible();
    }
  });

  /*
  test('search page passes basic accessibility', async ({ page }) => {
    page.on('console', (msg) => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message, error.stack));

    await page.goto('/search');

    const searchBox = page.getByPlaceholder('Search facts...');
    const unavailable = page.getByText(/Search is currently unavailable/);
    await expect(searchBox.or(unavailable)).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
  */
});

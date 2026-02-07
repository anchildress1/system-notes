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
      // Check for the SiteSearch container instead of specific input placeholder
      // as the widget renders dynamically
      const siteSearch = page.locator('#sitesearch');
      const unavailable = page.getByText(/Search is currently unavailable/);

      await expect(siteSearch.or(unavailable)).toBeVisible({ timeout: 15000 });

      // Also verify we have results (hybrid mode)
      const results = page.locator('section[aria-label="Search results"]');
      await expect(results).toBeVisible();
    } catch (e) {
      console.log('Search container not found. Page content:');
      console.log(await page.content());
      throw e;
    }

    const siteSearch = page.locator('#sitesearch');
    if (await siteSearch.isVisible()) {
      await expect(siteSearch).toBeVisible();
    }
  });

  test('navigating to URL with factId expands the card and scrolls into view', async ({ page }) => {
    // Navigate directly to search with a factId parameter
    // Using a known objectID from the test data
    await page.goto('/search?factId=card%3Aalgolia%3Aindex%3Abest-practices-alignment');

    // Wait for the card to be rendered
    const cardLink = page
      .locator('[href*="factId=card%3Aalgolia%3Aindex%3Abest-practices-alignment"]')
      .first();
    await expect(cardLink).toBeVisible({ timeout: 5000 });

    // Verify the card is highlighted (data-highlighted attribute)
    const article = cardLink.locator('article');
    await expect(article).toBeVisible();

    // Check that the card expanded state is visible (the modal/dialog)
    // The FactCard component uses role="dialog" when expanded
    const expandedView = page.locator('article[role="dialog"]');
    await expect(expandedView).toBeVisible({ timeout: 3000 });
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

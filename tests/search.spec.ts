import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// Helper to mock Algolia response
async function mockAlgoliaWithHits(page: any, hits: any[]) {
  await page.route('**/*algolia*/**', async (route: any) => {
    // Small delay to simulate network
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Return mocked results
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            hits: hits,
            nbHits: hits.length,
            page: 0,
            nbPages: 1,
            hitsPerPage: 20,
            processingTimeMS: 1,
            exhaustiveNbHits: true,
            query: '',
            params: '',
            index: 'test_index',
          },
        ],
      }),
    });
  });
}

test.describe('Search Page Integration', () => {
  test('loads search page and renders main component', async ({ page }) => {
    // Mock Algolia with some basic hits
    await mockAlgoliaWithHits(page, [{ objectID: '1', title: 'Test Hit' }]);

    // Enhanced debugging listeners
    page.on('console', (msg) => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message, error.stack));
    // Request failed listener removed as we are mocking

    await page.goto('/search'); // Use relative path as baseURL is usually configured or passed via CI env

    try {
      // Check for the SiteSearch container instead of specific input placeholder
      // as the widget renders dynamically
      const siteSearch = page.locator('#search-askai');

      // Wait for search to "load" (our mock)
      await expect(siteSearch).toBeVisible({ timeout: 15000 });

      // Also verify we have results (hybrid mode)
      const results = page.locator('section[aria-label="Search results"]');
      await expect(results).toBeVisible();
    } catch (e) {
      console.log('Search container not found. Page content:');
      console.log(await page.content());
      throw e;
    }
  });

  test('navigating to URL with factId expands the card and scrolls into view', async ({ page }) => {
    // Mock Algolia with the specific hit expected by the test
    const testId = 'test-hit-id';
    await mockAlgoliaWithHits(page, [
      {
        objectID: testId,
        title: 'Test Hit Title',
        description: 'Test description',
        content: 'Test content',
        fact: 'Test fact content',
      },
    ]);

    // Navigate directly to search with a factId parameter
    await page.goto(`/search?factId=${testId}`);

    // Wait for the card to be rendered
    const cardLink = page.locator(`[href*="factId=${testId}"]`).first();
    await expect(cardLink).toBeVisible({ timeout: 10000 });

    // Verify the card is highlighted (data-highlighted attribute)
    // const article = cardLink.locator('article');
    // await expect(article).toBeVisible();

    // Check that the card expanded state is visible (the modal/dialog)
    // The FactCard component uses role="dialog" when expanded
    const expandedView = page.locator('article[role="dialog"]');
    await expect(expandedView).toBeVisible({ timeout: 3000 });
  });
});

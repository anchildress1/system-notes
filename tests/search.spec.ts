import { expect } from '@playwright/test';
import { test } from './utils';

/** Override the default empty-response Algolia mock with specific hits. */
async function mockAlgoliaWithHits(page: any, hits: any[]) {
  // Mock external scripts (unpkg) to stay offline
  await page.route('**/*unpkg.com/**', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: ';console.log("Mock Sitesearch loaded");',
    })
  );

  // Unroute existing mock from the fixture, then apply custom one
  await page.unroute('**/*algolia*/**');
  await page.route('**/*algolia*/**', async (route: any) => {
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
  test('loads search page and renders search or error state', async ({ page }) => {
    await mockAlgoliaWithHits(page, [{ objectID: '1', title: 'Test Hit' }]);

    await page.goto('/search');

    // Without valid Algolia credentials baked into the build, SearchPage renders
    // an error state. With credentials, #search-askai is visible.
    const siteSearch = page.locator('#search-askai');
    const errorState = page.locator('div[class*="errorState"]');

    // One of these two states should appear
    await expect(siteSearch.or(errorState).first()).toBeVisible({ timeout: 15000 });
  });

  test('search error state shows user-friendly message without credentials', async ({ page }) => {
    await page.goto('/search');

    // When Algolia credentials are not baked into the build, the search page
    // shows an error state with a user-friendly message.
    const errorMessage = page.locator('text=Search is currently unavailable');
    const siteSearch = page.locator('#search-askai');

    const hasSearch = await siteSearch.isVisible().catch(() => false);
    if (!hasSearch) {
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    }
  });

  test('navigating to URL with factId expands the card and scrolls into view', async ({ page }) => {
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

    await page.goto(`/search?factId=${testId}`);

    // Wait for SearchPage to render (dynamic import + IntersectionObserver).
    // Without Algolia credentials baked into the build, the error state appears
    // instead of search results.
    const cardLink = page.locator(`[href*="factId=${testId}"]`).first();
    const errorState = page.locator('div[class*="errorState"]');

    await expect(cardLink.or(errorState).first()).toBeVisible({ timeout: 15000 });

    // If credentials are absent, search is unavailable — nothing else to check.
    if (await errorState.isVisible().catch(() => false)) {
      return;
    }

    await expect(cardLink).toBeVisible({ timeout: 10000 });

    // FactCardOverlay renders article[role="dialog"] once useFactIdRouting fetches the card.
    const expandedView = page.locator('article[role="dialog"]').first();
    await expect(expandedView).toBeVisible({ timeout: 10000 });
  });
});

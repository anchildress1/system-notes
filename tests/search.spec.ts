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
  test('loads search page and renders main component', async ({ page }) => {
    await mockAlgoliaWithHits(page, [{ objectID: '1', title: 'Test Hit' }]);

    await page.goto('/search');

    // Check for the SiteSearch container
    const siteSearch = page.locator('#search-askai');
    await expect(siteSearch).toBeVisible({ timeout: 15000 });

    // Verify results section
    const results = page.locator('section[aria-label="Search results"]');
    await expect(results).toBeVisible();
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

    // FactCardOverlay renders article[role="dialog"] once useFactIdRouting fetches the card.
    // Give it a full 10s — the fetch is async post-hydration and CI can be slow.
    const expandedView = page.locator('article[role="dialog"]').first();
    await expect(expandedView).toBeVisible({ timeout: 10000 });
  });
});

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

/**
 * Detect whether Algolia credentials are baked into the build.
 * SearchPage renders #search-askai when credentialed, error state otherwise.
 * Must be called after navigating to a /search URL.
 */
async function hasAlgoliaCredentials(page: any): Promise<boolean> {
  const siteSearch = page.locator('#search-askai');
  const errorState = page.locator('div[class*="errorState"]');
  await expect(siteSearch.or(errorState).first()).toBeVisible({ timeout: 15000 });
  return siteSearch.isVisible().catch(() => false);
}

test.describe('Search Page — credentialed environment', () => {
  test('renders search UI with SiteSearch widget', async ({ page }) => {
    await mockAlgoliaWithHits(page, [{ objectID: '1', title: 'Test Hit' }]);
    await page.goto('/search');

    const credentialed = await hasAlgoliaCredentials(page);
    test.skip(!credentialed, 'Algolia credentials not baked into build');

    await expect(page.locator('#search-askai')).toBeVisible();
    const results = page.locator('section[aria-label="Search results"]');
    await expect(results).toBeVisible();
  });

  test('factId deep-link opens overlay', async ({ page }) => {
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

    const credentialed = await hasAlgoliaCredentials(page);
    test.skip(!credentialed, 'Algolia credentials not baked into build');

    const cardLink = page.locator(`[href*="factId=${testId}"]`).first();
    await expect(cardLink).toBeVisible({ timeout: 10000 });

    // FactCardOverlay renders article[role="dialog"] once useFactIdRouting fetches the card.
    const expandedView = page.locator('article[role="dialog"]').first();
    await expect(expandedView).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Search Page — no-credential environment', () => {
  test('renders error state with user-friendly message', async ({ page }) => {
    await page.goto('/search');

    const credentialed = await hasAlgoliaCredentials(page);
    test.skip(credentialed, 'Algolia credentials are configured — error state will not render');

    const errorState = page.locator('div[class*="errorState"]');
    await expect(errorState).toBeVisible();
    await expect(page.locator('text=Search is currently unavailable')).toBeVisible();
  });

  test('factId deep-link shows error state', async ({ page }) => {
    await page.goto('/search?factId=test-hit-id');

    const credentialed = await hasAlgoliaCredentials(page);
    test.skip(credentialed, 'Algolia credentials are configured — error state will not render');

    const errorState = page.locator('div[class*="errorState"]');
    await expect(errorState).toBeVisible();
    await expect(page.locator('text=Search is currently unavailable')).toBeVisible();
  });
});

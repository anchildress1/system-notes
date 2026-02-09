import { test as base, Page } from '@playwright/test';

/**
 * Mocks Algolia network requests to prevent external calls and ensure deterministic tests.
 * Returns empty results so Chat/Search widgets stay idle.
 */
export async function mockAlgolia(page: Page) {
  await page.route('**/*algolia*/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            hits: [],
            nbHits: 0,
          },
        ],
      }),
    });
  });
}

/**
 * Extended Playwright test fixture that automatically mocks Algolia on every page.
 * Import `test` from this module instead of `@playwright/test` to get universal mocking.
 */
export const test = base.extend<{ autoMockAlgolia: void }>({
  autoMockAlgolia: [
    async ({ page }, use) => {
      await mockAlgolia(page);
      await use();
    },
    { auto: true },
  ],
});

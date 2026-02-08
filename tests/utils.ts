import { Page } from '@playwright/test';

/**
 * Mocks Algolia network requests to prevent external calls and ensure deterministic tests.
 */
export async function mockAlgolia(page: Page) {
  await page.route('**/*algolia*/**', async (route) => {
    // Small delay to simulate network but not hang
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Always return empty results to prevent Chat from opening automatically
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

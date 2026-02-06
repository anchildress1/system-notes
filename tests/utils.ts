import { Page } from '@playwright/test';

/**
 * Injects CSS to hide the Chat widget and floating controls to prevent click interception.
 * Uses robust selectors to avoid brittle hash dependencies.
 */
export async function injectTestStyles(page: Page) {
  await page.addStyleTag({
    content: `
      [class*="floatingControls"],
      .ais-Chat-window,
      .ais-Chat-toggleButton,
      [class*="ClientShell-module"][class*="floatingControls"] {
        display: none !important;
        pointer-events: none !important;
        z-index: -1 !important;
      }
    `,
  });
}

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

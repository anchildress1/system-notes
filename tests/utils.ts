import { expect, test as base, type Page } from '@playwright/test';

async function mockAlgolia(page: Page) {
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

export async function openFirstProjectCard(page: Page) {
  await page.goto('/projects');
  const url = page.url();
  const card = page.getByTestId(/^project-card-/).first();
  const toggle = card.locator('button[aria-label*="Flip to read the project note"]').first();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  return { card, toggle, url };
}

export const test = base.extend<{ autoMockAlgolia: void }>({
  autoMockAlgolia: [
    async ({ page }, use) => {
      await mockAlgolia(page);
      await use();
    },
    { auto: true },
  ],
});

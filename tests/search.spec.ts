import { expect, type Page } from '@playwright/test';
import { test } from './utils';

type MockHit = {
  objectID: string;
  title: string;
  blurb?: string;
  fact?: string;
  content?: string;
  category?: string;
  projects?: string[];
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  signal?: number;
  url?: string;
  __position?: number;
  __queryID?: string;
};

const buildHit = (overrides: Partial<MockHit> = {}): MockHit => ({
  objectID: 'test-hit-id',
  title: 'Test Hit Title',
  blurb: 'Test hit blurb',
  fact: 'Test fact content',
  content: 'Test content',
  category: 'Engineering',
  projects: ['Test Project'],
  'tags.lvl0': ['Testing'],
  'tags.lvl1': ['Testing > Browser'],
  signal: 3,
  url: 'https://github.com/anchildress1/system-notes',
  __position: 1,
  __queryID: 'test-query-id',
  ...overrides,
});

async function mockAlgoliaSearch(page: Page, hits: MockHit[]) {
  await page.unroute('**/*algolia*/**');
  await page.route('**/*algolia*/**', async (route) => {
    let requestCount = 1;
    try {
      const payload = route.request().postDataJSON() as { requests?: unknown[] };
      requestCount = Array.isArray(payload.requests) ? payload.requests.length : 1;
    } catch {
      requestCount = 1;
    }

    const result = {
      hits,
      nbHits: hits.length,
      page: 0,
      nbPages: hits.length > 0 ? 1 : 0,
      hitsPerPage: 24,
      processingTimeMS: 1,
      exhaustiveNbHits: true,
      query: '',
      params: '',
      index: 'system-notes',
      facets: {
        projects: hits.reduce<Record<string, number>>((acc, hit) => {
          for (const project of hit.projects ?? []) acc[project] = (acc[project] ?? 0) + 1;
          return acc;
        }, {}),
        category: hits.reduce<Record<string, number>>((acc, hit) => {
          if (hit.category) acc[hit.category] = (acc[hit.category] ?? 0) + 1;
          return acc;
        }, {}),
        'tags.lvl0': hits.reduce<Record<string, number>>((acc, hit) => {
          for (const tag of hit['tags.lvl0'] ?? []) acc[tag] = (acc[tag] ?? 0) + 1;
          return acc;
        }, {}),
      },
      renderingContent: {
        facetOrdering: {
          facets: { order: ['projects', 'category', 'tags.lvl0'] },
          values: {},
        },
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: Array.from({ length: requestCount }, () => result),
      }),
    });
  });
}

test.describe('Search Page', () => {
  test('renders the retrieve UI and mocked hit', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);

    await page.goto('/search');

    await expect(page.getByRole('searchbox', { name: 'Search the index' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Search results' }).getByText('Test Hit Title').first()
    ).toBeVisible();
    await expect(page.getByLabel('View source for Test Hit Title')).toBeVisible();
    await expect(page.getByText('1 entries · sorted by signal')).toBeVisible();
  });

  test('flips a mocked hit from a real card-area click', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/search');

    const resultCard = page
      .getByRole('region', { name: 'Search results' })
      .locator('article')
      .first();
    const state = resultCard.locator('[data-state]');
    await expect(state).toHaveAttribute('data-state', 'collapsed');

    const box = await resultCard.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(state).toHaveAttribute('data-state', 'expanded');
  });

  test('updates the q route state when typing', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit({ title: 'Carbon Trace Test' })]);
    await page.goto('/search');

    await page.getByRole('searchbox', { name: 'Search the index' }).fill('carbon');

    await expect(page).toHaveURL(/\/search\?q=carbon$/);
  });

  test('renders empty state when Algolia returns no hits', async ({ page }) => {
    await mockAlgoliaSearch(page, []);

    await page.goto('/search?q=nope');

    await expect(page.getByText(/No results/i)).toBeVisible();
    await expect(page.getByText('0 entries · sorted by signal')).toBeVisible();
  });

  test('keeps factId as inert legacy state', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);

    await page.goto('/search?factId=test-hit-id');

    await expect(page.getByRole('searchbox', { name: 'Search the index' })).toBeVisible();
    await expect(page.locator('article[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('[href*="factId="]')).toHaveCount(0);
  });

  test('opens and clears dynamic filters from mocked facet data', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/search');

    await page.getByRole('button', { name: /project filter, no selection/i }).click();
    const projectOptions = page.getByRole('group', { name: /project filter options/i });
    await expect(projectOptions).toBeVisible();
    await expect(projectOptions.getByRole('button', { name: /all/i })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(projectOptions.getByRole('button', { name: /test project/i })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: /project filter, 1 selected/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Clear all active filters/i }).click();

    await expect(page.getByRole('button', { name: /project filter, no selection/i })).toBeVisible();
  });
});

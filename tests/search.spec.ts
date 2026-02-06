import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectTestStyles } from './utils';

const mockSearchResults = {
  results: [
    {
      hits: [
        {
          objectID: 'card:test:test:0001',
          title: 'Test Fact Title',
          blurb: 'This is a test blurb for the fact.',
          fact: 'This is the detailed fact content that explains the insight.',
          tags: ['tag-one', 'tag-two', 'testing'],
          projects: ['System Notes', 'Test Project'],
          category: 'Work Style',
          signal: 3,
          _highlightResult: {
            title: { value: 'Test Fact Title', matchLevel: 'none', matchedWords: [] },
            blurb: {
              value: 'This is a test blurb for the fact.',
              matchLevel: 'none',
              matchedWords: [],
            },
          },
        },
        {
          objectID: 'card:test:test:0002',
          title: 'Another Fact',
          blurb: 'Second fact blurb.',
          fact: 'Second detailed fact content.',
          tags: ['ai-collaboration'],
          projects: ['Hermes Agent'],
          category: 'Philosophy',
          signal: 3,
          _highlightResult: {
            title: { value: 'Another Fact', matchLevel: 'none', matchedWords: [] },
            blurb: { value: 'Second fact blurb.', matchLevel: 'none', matchedWords: [] },
          },
        },
      ],
      nbHits: 2,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      facets: {
        tags: { 'tag-one': 1, 'tag-two': 1, testing: 1, 'ai-collaboration': 1 },
        projects: { 'System Notes': 1, 'Test Project': 1, 'Hermes Agent': 1 },
        category: { 'Work Style': 1, Philosophy: 1 },
      },
    },
  ],
};

test.describe('Search Page Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*.algolia.net/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.route('**/*.algolianet.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults),
      });
    });

    await injectTestStyles(page);
  });

  test('loads search page with correct title', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveTitle(/Fact Index/);
    await expect(page.getByRole('heading', { level: 1, name: 'Fact Index' })).toBeVisible();
  });

  test('renders search box', async ({ page }) => {
    await page.goto('/search');
    const searchBox = page.getByRole('searchbox', { name: 'Search' });
    await expect(searchBox).toBeVisible();
  });

  test('renders fact cards with results', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Test Fact Title')).toBeVisible();
    await expect(page.getByText('This is a test blurb for the fact.')).toBeVisible();
  });

  test('renders filter sidebar with facets', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { level: 2, name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Category' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Tags' })).toBeVisible();
  });

  test('navigates to search from header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Fact Index' }).click({ force: true });
    await expect(page).toHaveURL('/search');
    await expect(page.getByRole('heading', { level: 1, name: 'Fact Index' })).toBeVisible();
  });

  test('displays category labels on cards', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Work Style').first()).toBeVisible();
  });

  test('displays tags on fact cards', async ({ page }) => {
    await page.goto('/search');
    const firstCard = page.getByRole('article').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await expect(firstCard.getByText('tag-one')).toBeVisible();
    await expect(firstCard.getByText('tag-two')).toBeVisible();
  });

  test('displays project labels on cards', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('System Notes').first()).toBeVisible();
  });

  test('search page passes accessibility checks', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

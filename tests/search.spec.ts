import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, type MockAlgoliaHit, test } from './utils';

const buildHit = (overrides: Partial<MockAlgoliaHit> = {}): MockAlgoliaHit => ({
  objectID: 'card:test:1',
  title: 'Failure is useful data',
  blurb: 'A short explanation of the decision.',
  fact: 'The complete evidence behind the decision.',
  content: 'The complete evidence behind the decision.',
  category: 'Principle',
  projects: ['System Notes'],
  'tags.lvl0': ['Testing'],
  'tags.lvl1': ['Testing > Failure paths'],
  url: 'https://github.com/anchildress1/system-notes',
  created_at: '2026-08-01T00:00:00Z',
  ...overrides,
});

test.describe('Notes index', () => {
  test('renders the search surface and mocked note on the canonical route', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');

    await expect(page.getByRole('searchbox', { name: 'Search the notes index' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Notes results' })).toContainText(
      'Failure is useful data'
    );
    await expect(page.getByText(/1 entry · 1ms/i)).toBeVisible();
  });

  test('moves focus into a note promoted from the queue', async ({ page }) => {
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second decision' }),
    ]);
    await page.goto('/');

    await page.getByRole('button', { name: /Second decision/i }).click();

    await expect(page.getByRole('button', { name: 'Open note: Second decision' })).toBeFocused();
  });

  test('flips a note locally without changing the URL', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');
    const initialURL = page.url();
    const card = page.getByRole('article').filter({ hasText: 'Failure is useful data' });

    await card.getByRole('button', { name: /Open note/i }).click();

    await expect(card).toHaveAttribute('data-state', 'expanded');
    await expect(card.getByText('The complete evidence behind the decision.')).toBeVisible();
    expect(page.url()).toBe(initialURL);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    await card.getByRole('button', { name: /Close note/i }).click();
    await expect(card).toHaveAttribute('data-state', 'collapsed');
  });

  test('swaps visible faces and restores focus with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');
    const card = page.getByRole('article').filter({ hasText: 'Failure is useful data' });
    const open = card.getByRole('button', { name: /Open note/i });

    await open.click();
    const close = card.getByRole('button', { name: /Close note/i });
    await expect(open).not.toBeVisible();
    await expect(close).toBeVisible();
    await expect(close).toBeFocused();

    await close.click();
    await expect(close).not.toBeVisible();
    await expect(open).toBeVisible();
    await expect(open).toBeFocused();
  });

  test('exposes full-note and source evidence from the open face', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');
    const card = page.getByRole('article').filter({ hasText: 'Failure is useful data' });

    await card.getByRole('button', { name: /Open note/i }).click();

    await expect(card.getByRole('link', { name: /Permalink/i })).toHaveAttribute(
      'href',
      '/notes/card%3Atest%3A1'
    );
    await expect(card.getByRole('link', { name: /View source/i })).toHaveAttribute(
      'href',
      'https://github.com/anchildress1/system-notes'
    );
  });

  test('syncs the query through InstantSearch routing', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Search the notes index' }).fill('failure');

    await expect(page).toHaveURL(/\?q=failure$/);
  });

  test('renders the designed no-results state', async ({ page }) => {
    await mockAlgoliaSearch(page, []);
    await page.goto('/?q=missing');

    await expect(page.getByRole('heading', { name: 'No notes match that.' })).toBeVisible();
    await expect(page.getByText(/literal, not psychic/i)).toBeVisible();
    await expect(page.getByText(/0 entries · 1ms/i)).toBeVisible();
  });

  test('selects and clears project filters with native checkboxes', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Failure is useful data' })).toBeVisible();

    await page.getByText('Project', { exact: true }).click();
    const checkbox = page.getByRole('checkbox', { name: /System Notes/i });
    await checkbox.check();

    await expect(page).toHaveURL(/project=System(\+|%20)Notes/);
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(checkbox).not.toBeChecked();
    await expect(page).not.toHaveURL(/project=/);
  });

  test('keeps the result grid within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second' }),
    ]);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Failure is useful data' })).toBeVisible();

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });

  test('keeps absolute note numbering on later result pages', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()], {
      nbHits: 10,
      nbPages: 2,
      pageHits: {
        1: [buildHit({ objectID: 'card:test:6', title: 'Page two note' })],
      },
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Page 2' }).click();

    const pageTwoCard = page.getByRole('article').filter({ hasText: 'Page two note' });
    await expect(pageTwoCard).toBeVisible();
    await expect(pageTwoCard.getByText(/№ 06/)).toBeVisible();
  });
});

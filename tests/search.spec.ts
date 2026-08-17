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

  test('moves focus into a note selected from the ranked queue', async ({ page }) => {
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second decision' }),
    ]);
    await page.goto('/');

    await page
      .locator('[data-ranked-queue]')
      .getByRole('button', { name: /Second decision/i })
      .click();

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
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second decision', category: 'Architecture' }),
    ]);
    await page.goto('/');
    const secondTile = page.getByRole('button', { name: 'Read note 2: Second decision' });
    await expect(secondTile).toHaveCSS('transition-duration', '0s');
    await expect(secondTile).toHaveCSS('animation-name', 'none');
    await secondTile.press('Enter');
    await expect(secondTile).toHaveCSS('transition-duration', '0s');
    await expect(secondTile).toHaveCSS('animation-name', 'none');

    const card = page.getByRole('article').filter({ hasText: 'Second decision' });
    const open = card.getByRole('button', { name: /Open note/i });
    await expect(open).toBeFocused();

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

  test('maps the ordered top 100 to animated board controls', async ({ page }) => {
    const categories = ['Award', 'Decision', 'Architecture', 'Principle'] as const;
    const hits = Array.from({ length: 105 }, (_, index) =>
      buildHit({
        objectID: `card:test:${index + 1}`,
        title: `Ranked note ${index + 1}`,
        category: categories[index % categories.length],
        __position: index + 1,
      })
    );
    const requestedLimits: string[] = [];
    await mockAlgoliaSearch(page, hits, {
      onRequest: (params) => {
        const limit = params.get('hitsPerPage');
        if (limit) requestedLimits.push(limit);
      },
    });
    await page.goto('/');
    const initialURL = page.url();
    const board = page.getByRole('list', { name: 'Top ranked notes' });
    const tiles = board.getByRole('button');

    await expect(tiles).toHaveCount(100);
    await expect(tiles.nth(0)).toHaveAttribute('data-category', 'award');
    await expect(tiles.nth(1)).toHaveAttribute('data-category', 'decision');
    await expect(tiles.nth(2)).toHaveAttribute('data-category', 'architecture');
    await expect(tiles.nth(3)).toHaveAttribute('data-category', 'principle');
    await expect(tiles.nth(99)).toHaveAccessibleName('Read note 100: Ranked note 100');
    await expect(page.getByRole('button', { name: /Read note 101/i })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Notes pagination' })).toHaveCount(0);
    expect(requestedLimits).toContain('100');

    const tileTitles = await tiles.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('aria-label')?.replace(/^Read note \d+: /, ''))
    );
    const tileCategories = await tiles.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('data-category'))
    );
    const queueTitles = await page
      .locator('[data-ranked-queue] button')
      .evaluateAll((buttons) => buttons.map((button) => button.children.item(1)?.textContent));
    expect(tileTitles).toEqual(queueTitles);
    expect(tileCategories).toEqual(
      hits.slice(0, 100).map((hit) => hit.category?.toLocaleLowerCase())
    );

    const colorSignatures = await tiles.evaluateAll((buttons) =>
      buttons.slice(0, 4).map((button) => {
        const style = getComputedStyle(button);
        return `${style.backgroundColor}|${style.borderTopColor}|${style.borderTopWidth}`;
      })
    );
    expect(new Set(colorSignatures).size).toBe(4);

    await expect(tiles.nth(0)).toHaveJSProperty('tabIndex', 0);
    await expect(tiles.nth(1)).toHaveJSProperty('tabIndex', -1);
    await expect(tiles.nth(0)).toHaveCSS('animation-name', 'none');
    await tiles.nth(0).focus();
    await tiles.nth(0).press('ArrowLeft');
    await expect(tiles.nth(99)).toBeFocused();
    await tiles.nth(99).press('ArrowDown');
    await expect(tiles.nth(0)).toBeFocused();
    await tiles.nth(0).press('ArrowUp');
    await expect(tiles.nth(99)).toBeFocused();
    await tiles.nth(99).press('ArrowRight');
    await expect(tiles.nth(0)).toBeFocused();
    await tiles.nth(0).press('End');
    await expect(tiles.nth(99)).toBeFocused();
    await tiles.nth(99).press('Home');
    await expect(tiles.nth(0)).toBeFocused();
    await tiles.nth(0).press('a');
    await expect(tiles.nth(0)).toBeFocused();
    await tiles.nth(0).press('ArrowRight');
    await expect(tiles.nth(1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('searchbox', { name: 'Search the notes index' })).toBeFocused();

    const selectedTile = tiles.nth(36);
    await expect(selectedTile).not.toHaveCSS('transition-duration', '0s');
    await selectedTile.click();

    await expect(selectedTile).toHaveAttribute('aria-pressed', 'true');
    await expect(selectedTile).toHaveCSS('animation-name', /board-select/);
    await expect(selectedTile).toHaveCSS('animation-duration', '0.36s');
    await expect(selectedTile).toHaveCSS('animation-iteration-count', '1');
    await expect(selectedTile).toHaveCSS(
      'animation-timing-function',
      'cubic-bezier(0.16, 1, 0.3, 1)'
    );
    const selectedCard = page.getByRole('article').filter({ hasText: 'Ranked note 37' });
    await expect(
      selectedCard.getByRole('button', { name: 'Open note: Ranked note 37' })
    ).toBeFocused();
    expect(page.url()).toBe(initialURL);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });
});

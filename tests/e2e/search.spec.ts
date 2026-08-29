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
    await page.goto('/notes');

    await expect(page.getByRole('searchbox', { name: 'Search the notes index' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Notes results' })).toContainText(
      'Failure is useful data'
    );
    await expect(page.getByText(/1 entry · 1ms/i)).toBeVisible();
  });

  test('keeps keyboard focus in the queue while updating the static reader', async ({ page }) => {
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second decision' }),
    ]);
    await page.goto('/notes');
    const initialURL = page.url();

    const queueRow = page.locator('[data-ranked-queue]').getByRole('button').first();
    await expect(queueRow).toContainText('Second decision');
    await queueRow.focus();
    await queueRow.press('Enter');

    await expect(page.getByLabel('Now reading: Second decision')).toBeFocused();
    await expect(page.getByRole('article')).toContainText('Second decision');
    await expect(page.getByRole('article')).toContainText(
      'The complete evidence behind the decision.'
    );
    expect(page.url()).toBe(initialURL);
  });

  test('shows the title, fact, category, project, and evidence links without a flip', async ({
    page,
  }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/notes');
    const initialURL = page.url();
    const card = page.getByRole('article').filter({ hasText: 'Failure is useful data' });

    await expect(card.getByRole('heading', { name: 'Failure is useful data' })).toBeVisible();
    await expect(card.getByText('The complete evidence behind the decision.')).toBeVisible();
    await expect(card.getByText('Principle')).toBeVisible();
    await expect(card.getByText(/System Notes/)).toBeVisible();
    await expect(card.getByRole('button', { name: /Open note|Close note/i })).toHaveCount(0);
    await expect(card.getByRole('link', { name: /Permalink/i })).toHaveCount(0);
    await expect(card.getByRole('link', { name: /View source/i })).toHaveAttribute(
      'href',
      'https://github.com/anchildress1/system-notes'
    );
    expect(page.url()).toBe(initialURL);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('keeps the composite board operable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockAlgoliaSearch(page, [
      buildHit(),
      buildHit({ objectID: 'card:test:2', title: 'Second decision', category: 'Architecture' }),
    ]);
    await page.goto('/notes');
    const board = page.getByRole('listbox', { name: 'Top ranked notes' });
    const secondTile = page.getByRole('option', { name: 'Read note 2: Second decision' });
    const reducedTileMotion = () =>
      secondTile.evaluate((option) => {
        const style = getComputedStyle(option, '::before');
        return { animation: style.animationName, transition: style.transitionDuration };
      });
    await expect.poll(reducedTileMotion).toEqual({ animation: 'none', transition: '0s' });
    await board.focus();
    await board.press('ArrowRight');
    await expect.poll(reducedTileMotion).toEqual({ animation: 'none', transition: '0s' });
    await expect(board).toBeFocused();
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    await expect(page.getByRole('article')).toContainText('Second decision');
  });

  test('syncs the query through InstantSearch routing', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/notes');

    await page.getByRole('searchbox', { name: 'Search the notes index' }).fill('failure');

    await expect(page).toHaveURL(/\?q=failure$/);
  });

  test('renders the designed no-results state', async ({ page }) => {
    await mockAlgoliaSearch(page, []);
    await page.goto('/notes?q=missing');

    await expect(page.getByRole('heading', { name: 'No notes match that.' })).toBeVisible();
    await expect(page.getByText(/literal, not psychic/i)).toBeVisible();
    await expect(page.getByText(/0 entries · 1ms/i)).toBeVisible();
  });

  test('selects and clears project filters with native checkboxes', async ({ page }) => {
    await mockAlgoliaSearch(page, [buildHit()]);
    await page.goto('/notes');
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
    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Failure is useful data' })).toBeVisible();

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });

  test('maps all 347 ranked notes to one animated composite board', async ({ page }) => {
    const categories = ['Award', 'Decision', 'Architecture', 'Principle'] as const;
    const hits = Array.from({ length: 347 }, (_, index) =>
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
    await page.goto('/notes');
    const initialURL = page.url();
    const board = page.getByRole('listbox', { name: 'Top ranked notes' });
    const tiles = board.getByRole('option');

    // Unfiltered, the board trims to whole rows, so its tile count follows the
    // resolved column track rather than the hit count and differs per viewport.
    // Assert the shape contract instead of a fixed number.
    const boardShape = await board.evaluate((node) => ({
      columns: globalThis.getComputedStyle(node).gridTemplateColumns.split(/\s+/).filter(Boolean)
        .length,
      tiles: node.children.length,
    }));
    expect(boardShape.columns).toBeGreaterThan(0);
    expect(boardShape.tiles).toBeLessThan(hits.length);
    expect(boardShape.tiles % boardShape.columns).toBe(0);

    await expect(tiles).toHaveCount(boardShape.tiles);
    // Tiles carry the note's category verbatim — the index owns the taxonomy.
    await expect(tiles.nth(0)).toHaveAttribute('data-category', 'Award');
    await expect(tiles.nth(1)).toHaveAttribute('data-category', 'Decision');
    await expect(tiles.nth(2)).toHaveAttribute('data-category', 'Architecture');
    await expect(tiles.nth(3)).toHaveAttribute('data-category', 'Principle');
    await expect(tiles.nth(boardShape.tiles - 1)).toHaveAccessibleName(
      `Read note ${boardShape.tiles}: Ranked note ${boardShape.tiles}`
    );
    await expect(page.getByRole('navigation', { name: 'Notes pagination' })).toHaveCount(0);
    expect(requestedLimits).toContain('500');

    const tileTitles = await tiles.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('aria-label')?.replace(/^Read note \d+: /, ''))
    );
    const tileCategories = await tiles.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('data-category'))
    );
    const initialQueueTitles = await page
      .locator('[data-ranked-queue] button')
      .evaluateAll((buttons) => buttons.map((button) => button.children.item(1)?.textContent));
    // The board keeps rank order and trims from the tail, so the tiles are the
    // ranked list's prefix — never a reordering or a sample of it.
    const onBoard = hits.slice(0, boardShape.tiles);
    expect(tileTitles).toEqual(onBoard.map((hit) => hit.title));
    expect(initialQueueTitles).toEqual(hits.slice(1, 5).map((hit) => hit.title));
    expect(tileCategories).toEqual(onBoard.map((hit) => hit.category));

    const colorSignatures = await tiles.evaluateAll((options) =>
      options.slice(0, 4).map((option) => {
        const style = getComputedStyle(option, '::before');
        return `${style.backgroundColor}|${style.borderTopColor}|${style.borderTopWidth}`;
      })
    );
    expect(new Set(colorSignatures).size).toBe(4);
    // Tiles are a census mark, not a primary control: they are deliberately
    // smaller than a pointer target so 347 notes read as one composite block.
    // Every note they stand for stays reachable at full size through the search
    // box and the ranked queue, and the board itself is fully keyboard-operable
    // (asserted below), which is what carries the interaction — so this pins the
    // exact drawn size to catch accidental drift rather than asserting a
    // touch-target floor the mark is not trying to meet.
    const firstTarget = await tiles.nth(0).boundingBox();
    expect(firstTarget?.width).toBe(14);
    expect(firstTarget?.height).toBe(10);

    await expect(board).toHaveJSProperty('tabIndex', 0);
    await expect(tiles.nth(0)).toHaveJSProperty('tabIndex', -1);
    await expect(tiles.nth(1)).toHaveJSProperty('tabIndex', -1);
    await expect(tiles.nth(0)).toHaveCSS('animation-name', 'none');
    await board.focus();
    await board.press('ArrowLeft');
    await expect(board).toBeFocused();
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    await board.press('ArrowDown');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    await board.press('ArrowUp');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    await board.press('ArrowRight');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    // End lands on the board's last tile, which the row trim moves off the
    // ranked list's tail.
    await board.press('End');
    await expect(board).toHaveAttribute(
      'aria-activedescendant',
      `note-board-option-${boardShape.tiles - 1}`
    );
    await board.press('Home');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    await board.press('a');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    await board.press('ArrowRight');
    await expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('searchbox', { name: 'Search the notes index' })).toBeFocused();

    const selectedTile = page.getByRole('option', { name: 'Read note 37: Ranked note 37' });
    await selectedTile.click();

    await expect(board).toBeFocused();
    await expect(selectedTile).toHaveAttribute('aria-selected', 'true');
    const selectedMotion = await selectedTile.evaluate((option) => {
      const style = getComputedStyle(option, '::before');
      return {
        name: style.animationName,
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
        easing: style.animationTimingFunction,
      };
    });
    expect(selectedMotion).toEqual({
      name: expect.stringMatching(/board-select$/),
      duration: '0.36s',
      iterations: '1',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
    const selectedCard = page.getByRole('article').filter({ hasText: 'Ranked note 37' });
    await expect(selectedCard.getByRole('heading', { name: 'Ranked note 37' })).toBeVisible();
    await expect(selectedCard).toContainText('The complete evidence behind the decision.');
    const selectedQueueTitles = await page
      .locator('[data-ranked-queue] button')
      .evaluateAll((buttons) => buttons.map((button) => button.children.item(1)?.textContent));
    expect(selectedQueueTitles).toEqual(hits.slice(0, 4).map((hit) => hit.title));
    await expect(page.getByRole('list', { name: 'Highest-ranked alternate notes' })).toBeVisible();
    expect(page.url()).toBe(initialURL);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('keeps the board a rectangle at every width, including after a resize', async ({ page }) => {
    // The board trims itself to whole rows so it never renders a ragged last
    // row. The column count comes from the resolved grid track list, which
    // changes with the viewport, so the invariant has to hold across widths
    // and across a live resize — not just on a fresh load at one size.
    const hits = Array.from({ length: 347 }, (_, index) =>
      buildHit({
        objectID: `card:test:${index + 1}`,
        title: `Ranked note ${index + 1}`,
        __position: index + 1,
      })
    );
    await mockAlgoliaSearch(page, hits);
    await page.goto('/notes');
    const board = page.getByRole('listbox', { name: 'Top ranked notes' });
    await expect(board.getByRole('option').first()).toBeVisible();

    const shape = async () =>
      board.evaluate((node) => {
        const rows = new Map<number, number>();
        for (const tile of node.children) {
          const top = Math.round(tile.getBoundingClientRect().top);
          rows.set(top, (rows.get(top) ?? 0) + 1);
        }
        return {
          tiles: node.children.length,
          rowLengths: [...new Set(rows.values())],
          columns: globalThis
            .getComputedStyle(node)
            .gridTemplateColumns.split(/\s+/)
            .filter(Boolean).length,
        };
      });

    const isRectangle = (s: { rowLengths: number[]; columns: number }) =>
      s.rowLengths.length === 1 && s.rowLengths[0] === s.columns;

    for (const width of [1440, 1180, 1024, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      // Re-measuring runs off a ResizeObserver, so poll the board's own shape
      // rather than asserting against the previous width's tile count. Each
      // attempt takes ONE snapshot: reading tiles and columns separately lets
      // the two reads straddle a re-render and report a shape that never was.
      // The snapshot is kept so the assertions below read the same one the
      // poll accepted, instead of measuring a seventh time.
      let settled = await shape();
      await expect
        .poll(
          async () => {
            settled = await shape();
            return isRectangle(settled);
          },
          { timeout: 2500, intervals: [100], message: `board never settled at ${width}px` }
        )
        .toBe(true);

      const { tiles, rowLengths, columns } = settled;
      // One distinct row length is the whole point: every row is full.
      expect(rowLengths, `ragged board at ${width}px`).toHaveLength(1);
      expect(rowLengths[0]).toBe(columns);
      expect(tiles).toBeGreaterThan(0);
      expect(tiles).toBeLessThanOrEqual(hits.length);
    }
  });

  test('ignores a ?note param and opens the top-ranked note', async ({ page }) => {
    await mockAlgoliaSearch(page, [
      buildHit({ objectID: 'card:test:1', title: 'First decision' }),
      buildHit({
        objectID: 'card:test:2',
        title: 'Selected decision',
        category: 'Decision',
      }),
    ]);
    // Selection lives in the workspace, not the URL. A stale ?note link is inert
    // rather than authoritative, so the reader opens on the top-ranked note.
    await page.goto('/notes?note=card%3Atest%3A2');

    await expect(page.getByRole('article')).toContainText('First decision');
    await expect(page.getByRole('listbox', { name: 'Top ranked notes' })).toHaveAttribute(
      'aria-activedescendant',
      'note-board-option-0'
    );
  });
});

test.describe('Refinement visibility', () => {
  test('shows a refined project as selected even when Algolia omits it from the facet list', async ({
    page,
  }) => {
    // Algolia returns at most `limit` facet values, ordered by count, so a
    // project with few notes can be filtered on without ever appearing in the
    // list. The refinement still applies — the results narrow — but the control
    // that would show it, and let it be undone, was never rendered.
    await mockAlgoliaSearch(
      page,
      [
        {
          objectID: 'card:rare:1',
          title: 'A note from a rarely-filed project',
          blurb: 'Evidence attached.',
          fact: 'The complete decision.',
          category: 'Principle',
          projects: ['Rare Project'],
          'tags.lvl0': ['Testing'],
        },
      ],
      {
        facets: {
          category: { Principle: 1 },
          'tags.lvl0': { Testing: 1 },
          // Every other project outranks it; this one never comes back.
          projects: { 'Loud Project': 300 },
        },
      }
    );
    await page.goto('/notes?project=Rare+Project');

    await page
      .locator('summary')
      .filter({ hasText: /^Project/ })
      .click();

    await expect(page.getByRole('checkbox', { name: /Rare Project/ })).toBeChecked();
  });

  test('carries the project refinement through the click from the exhibits page', async ({
    page,
  }) => {
    const projects = Object.fromEntries(
      Array.from({ length: 24 }, (_, index) => [`Filler Project ${index + 1}`, 300 - index])
    );
    await mockAlgoliaSearch(
      page,
      [
        {
          objectID: 'card:system-notes:1',
          title: 'A System Notes decision',
          blurb: 'Evidence attached.',
          fact: 'The complete decision.',
          category: 'Principle',
          projects: ['System Notes'],
          'tags.lvl0': ['Testing'],
        },
      ],
      { facets: { category: { Principle: 1 }, 'tags.lvl0': { Testing: 1 }, projects } }
    );

    await page.goto('/projects');
    await page.getByTestId('project-system-notes').click();
    await page
      .getByRole('article')
      .getByRole('link', { name: /Decisions from System Notes/ })
      .click();

    await expect(page).toHaveURL(/project=System(?:\+|%20)Notes#notes-index$/);
    await page
      .locator('summary')
      .filter({ hasText: /^Project/ })
      .click();

    await expect(page.getByRole('checkbox', { name: /System Notes/ })).toBeChecked();
  });

  test('selects the facet when the index spells the project with different case', async ({
    page,
  }) => {
    // Algolia matches facet filters case-insensitively, so the results narrow
    // correctly whatever case the link carries. isRefined is a strict string
    // compare on the client, so a record filed as "System notes" filters fine
    // and shows an unchecked box next to it.
    await mockAlgoliaSearch(
      page,
      [
        {
          objectID: 'card:system-notes:1',
          title: 'A System Notes decision',
          blurb: 'Evidence attached.',
          fact: 'The complete decision.',
          category: 'Principle',
          projects: ['System notes'],
          'tags.lvl0': ['Testing'],
        },
      ],
      {
        facets: {
          category: { Principle: 1 },
          'tags.lvl0': { Testing: 1 },
          projects: { 'System notes': 42 },
        },
      }
    );
    await page.goto('/notes?project=System+Notes');

    await page
      .locator('summary')
      .filter({ hasText: /^Project/ })
      .click();

    const boxes = page.getByRole('checkbox', { name: /System notes/i });
    await expect(boxes).toHaveCount(1);
    await expect(boxes).toBeChecked();
  });
});

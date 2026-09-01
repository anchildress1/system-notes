import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, test } from './utils';

const viewports = [
  // 280 is a folding phone's cover screen, and it is also what a 1280px window
  // looks like at 400% zoom — the width WCAG 1.4.10 asks to reflow to. The page
  // used to hold a 320px floor and clip the overflow, so 40px of every route was
  // not merely off screen but unreachable: scrollX could not leave 0.
  { width: 280, height: 720 },
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.width}px responsive layout`, () => {
    test.use({ viewport });

    for (const path of ['/', '/notes', '/projects', '/about']) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path);

        const widths = await page.evaluate(() => {
          window.scrollTo(9999, window.scrollY);
          const reached = window.scrollX;
          window.scrollTo(0, window.scrollY);
          return {
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
            body: Math.round(document.body.getBoundingClientRect().width),
            reached,
          };
        });
        expect(widths.scroll).toBe(widths.client);
        // Anything past the fold must at least be scrollable to. Clipping
        // overflow instead of laying it out is how content goes missing.
        expect(widths.scroll - widths.client - widths.reached).toBeLessThanOrEqual(0);
        expect(widths.body).toBeLessThanOrEqual(widths.client);
      });
    }
  });
}

// Only the checks whose answer changes with the viewport. Everything else axe
// asks about these pages is markup, and markup does not reflow — theme.spec.ts
// already scans all four routes in both themes and would report the same
// violation twice. Reflow itself (WCAG 1.4.10) is asserted above, in pixels,
// because axe has no rule for it.
test.describe('mobile layout accessibility', () => {
  // Box arithmetic, not rendering: both engines lay a 24px target out the same
  // way, and where they do not, the boundingBox assertions in this file run on
  // both and catch it. Re-running the rule on WebKit would restate the answer.
  test.skip(({ browserName }) => browserName !== 'chromium', 'target size is box arithmetic');

  // The narrowest supported width. A target that clears 24px here clears it at
  // every wider viewport, so the other three widths would only repeat this.
  test.use({ viewport: { width: 280, height: 720 } });

  for (const path of ['/', '/notes', '/projects', '/about']) {
    test(`${path} keeps every touch target reachable at 280px`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page }).withRules(['target-size']).analyze();

      // withRules silently reports nothing when the rule did not run, which
      // would make this pass without measuring a single target.
      const evaluated = [...results.passes, ...results.violations, ...results.incomplete];
      expect(evaluated.map((result) => result.id)).toContain('target-size');
      expect(results.violations).toEqual([]);
    });
  }

  // One route, one width: the tag is written once in the root layout, so
  // asserting it per route would be four copies of the same fact.
  test('lets the page be pinched open', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).withRules(['meta-viewport']).analyze();

    expect(results.violations).toEqual([]);
    expect(results.passes.map((result) => result.id)).toContain('meta-viewport');
  });
});

test.describe('mobile interactions', () => {
  test('keeps hash targets clear of the mobile header', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await mockAlgoliaSearch(page, []);
      await page.goto('/notes?project=System+Notes#notes-index');
      const target = page.locator('#notes-index');
      await expect(target).toBeVisible();

      const clearance = await page.evaluate(() => {
        const header = document.querySelector('header')!.getBoundingClientRect();
        const notes = document.querySelector('#notes-index')!.getBoundingClientRect();
        return notes.top - Math.max(0, header.bottom);
      });
      expect(clearance, `hash target is obscured at ${width}px`).toBeGreaterThanOrEqual(0);
    }
  });

  test('keeps every primary destination visible without a hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await expect(nav.getByRole('link', { name: 'ask me a question' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'how I decide' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'what I’ve shipped' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'about me' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /blog/i })).toBeVisible();
  });

  test('stacks the filing rail above retrieval without horizontal drift', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/notes');
    const sidebar = page.getByRole('region', { name: /Browse notes by type/i });
    const search = page.getByRole('searchbox', { name: 'Search the notes index' });

    const sidebarBox = await sidebar.boundingBox();
    const searchBox = await search.boundingBox();
    expect(sidebarBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(sidebarBox!.y + sidebarBox!.height).toBeLessThanOrEqual(searchBox!.y);

    await sidebar.getByRole('button', { name: /Filed under/i }).click();
    await expect(sidebar.getByRole('button', { name: /Menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('keeps the theme song player inside the viewport on the about page', async ({ page }) => {
    // The player moved out of the header, so the panel that used to hang off the
    // pill is gone. What matters now is that the control and its equaliser stay
    // within the page at the width where the layout is tightest.
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/about');

      const player = page.getByRole('button', { name: /theme song/i });
      await expect(player).toBeVisible();

      const box = await player.boundingBox();
      expect(box, `no control at ${width}px`).not.toBeNull();
      expect(box!.x, `control starts off-screen at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `control ends off-screen at ${width}px`).toBeLessThanOrEqual(
        width
      );
    }
  });

  test('keeps the seven-exhibit catalogue in one readable column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');

    await expect(page.getByTestId('exhibit-save-the-sun').getByRole('img')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(7);
    await expect(
      page.getByRole('region', { name: 'Selected exhibits' }).getByRole('button')
    ).toHaveCount(0);
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
});

import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, test } from './utils';

const viewports = [
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

        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(widths.scroll).toBe(widths.client);
      });

      // Desktop-only axe runs miss the violations that only exist once the
      // layout reflows â reflow itself, target size, and anything the narrow
      // composition reorders or overlaps.
      test(`${path} has no accessibility violations`, async ({ page, browserName }) => {
        await page.goto(path);

        let builder = new AxeBuilder({ page });
        if (browserName === 'webkit') {
          // Every color here is authored in oklch, which WebKit reports back
          // as lab(). axe-core mis-reads that: it scored the header's
          // theme-song pill at 4.18:1 when the pixels WebKit actually paints
          // are #beb3bd on #0c050c â 9.95:1. The color axe reports is the real
          // one scaled by ~0.626 on every channel, which is a parser artefact
          // rather than anything the page renders. Contrast still runs on
          // Chromium at these same viewports, so the rule keeps its coverage;
          // only the engine that cannot read the color skips it.
          builder = builder.disableRules('color-contrast');
        }

        const accessibility = await builder.analyze();
        expect(accessibility.violations).toEqual([]);
      });
    }
  });
}

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

  test('expands a project into one readable column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');
    await page.getByTestId('project-system-notes').click();
    const detail = page.getByRole('article');

    await expect(detail.getByRole('img')).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'Outcome' })).toBeVisible();
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
});

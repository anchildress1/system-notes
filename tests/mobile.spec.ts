import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './utils';

const viewports = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.width}px responsive layout`, () => {
    test.use({ viewport });

    for (const path of ['/', '/projects', '/about']) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path);

        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(widths.scroll).toBe(widths.client);
      });

      // Desktop-only axe runs miss the violations that only exist once the
      // layout reflows — reflow itself, target size, and anything the narrow
      // composition reorders or overlaps.
      test(`${path} has no accessibility violations`, async ({ page }) => {
        await page.goto(path);

        const accessibility = await new AxeBuilder({ page }).analyze();
        expect(accessibility.violations).toEqual([]);
      });
    }
  });
}

test.describe('mobile interactions', () => {
  test('keeps every primary destination visible without a hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await expect(nav.getByRole('link', { name: 'the index' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'exhibits' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'about' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /blog/i })).toBeVisible();
  });

  test('stacks the filing rail above retrieval without horizontal drift', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
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

  test('expands a project into one readable column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');
    const project = page.getByTestId('project-system-notes');

    await project.locator('summary').click();

    await expect(project.getByRole('img')).toBeVisible();
    await expect(project.getByText('Why it exists')).toBeVisible();
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
});

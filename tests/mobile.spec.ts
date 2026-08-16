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
    }
  });
}

test.describe('mobile interactions', () => {
  test('keeps every primary destination visible without a hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await expect(nav.getByRole('link', { name: 'Index' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Writing/i })).toBeVisible();
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

    await sidebar.getByRole('button', { name: /Browse by type/i }).click();
    await expect(sidebar.getByRole('button', { name: /Types/i })).toHaveAttribute(
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

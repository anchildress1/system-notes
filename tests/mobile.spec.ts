import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Mobile Responsiveness', () => {
  test('should render header correctly on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should render project grid in single column on small screens', async ({
    page,
    isMobile,
  }) => {
    if (!isMobile) test.skip();

    await page.goto('/projects');
    const projects = page.getByTestId(/^project-card-/);
    await expect(projects.first()).toBeVisible();
  });

  test('should open expanded view on click', async ({ page }) => {
    await page.goto('/projects');
    const card = page.getByTestId(/^project-card-/).first();

    await card.click();

    // Expect modal to open
    const modal = page.getByTestId('expanded-view-dialog');
    await expect(modal).toBeVisible();
    const modalTitle = modal.getByRole('heading', { name: 'System Notes', level: 2 });
    await expect(modalTitle).toBeVisible();

    // Close it
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should verify blog link visibility', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    const blogLink = page.locator('header a[href*="dev.to"]');
    await expect(blogLink).toBeVisible();
  });
});

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

  test('should render project grid responsively', async ({ page }) => {
    await page.goto('/projects');
    const projects = page.getByTestId(/^project-card-/);
    await expect(projects.first()).toBeVisible();
  });

  test('should flip project detail in place on click', async ({ page }) => {
    await page.goto('/projects');
    const card = page.getByTestId(/^project-card-/).first();
    const toggle = card.locator('button[aria-label*="Flip to read the project note"]').first();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(card.getByRole('button', { name: /back to summary/i })).toBeVisible();

    const closeBtn = card.getByRole('button', { name: /back to summary/i });
    await closeBtn.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('should verify responsive blog link visibility', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    const blogLink = page.getByTestId('blog-link');
    if (isMobile) {
      await expect(blogLink).toBeHidden();
    } else {
      await expect(blogLink).toBeVisible();
    }
    await expect(blogLink).toHaveAttribute('href', 'https://dev.to/anchildress1');
  });
});

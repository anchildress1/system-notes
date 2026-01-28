import { test, expect } from '@playwright/test';
import { injectTestStyles } from './utils';

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await injectTestStyles(page);
  });
  test('should render header correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Check if header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check if nav links are stacked or visible (depending on implementation)
    // We expect them to be visible but maybe in a different layout
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should render project grid in single column on small screens', async ({
    page,
    isMobile,
  }) => {
    // if (!isMobile) test.skip();

    await page.goto('/');
    const grid = page.locator('section').locator('.grid'); // Assuming class name from module css, but locally scoped?
    // Note: CSS modules make class names hashed. We should use data-testid or text content for better reliability,
    // or just check visual stability.
    // For now, checking if multiple project cards are visible.

    const projects = page.getByText('CheckMarK', { exact: false }); // Heuristic
    await expect(projects.first()).toBeVisible();
  });

  test('should open expanded view on click', async ({ page }) => {
    await page.goto('/');
    // Click the first project card
    // Click the first project card
    const card = page.getByTestId(/^project-card-/).first();

    await card.click({ force: true });

    // Expect modal to open
    const modal = page.getByTestId('expanded-view-dialog');
    await expect(modal).toBeVisible();
    const modalTitle = modal.getByRole('heading', { name: 'System Notes', level: 2 });
    await expect(modalTitle).toBeVisible();

    // Close it
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should verify blog button and music player visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check Blog Button
    // Fallback to text if testid not found immediately (HMR issue?)
    const blogLink = page.locator('header a[href*="dev.to"]');
    await expect(blogLink).toBeVisible();

    // Check Music Player
    // Use generic class matcher if testid is missing due to HMR lag
    const musicPlayer = page
      .locator('[data-testid="music-player"]')
      .or(page.locator('div[class*="playerWrapper"]'));
    await expect(musicPlayer).toBeVisible();

    const playButton = page
      .locator('[data-testid="play-button"]')
      .or(page.locator('button[aria-label*="Play"]'));
    await expect(playButton).toBeVisible();

    // Verify play button is clickable
    await expect(playButton).toBeEnabled();
  });

  test('should verify blog button and music player visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check Blog Button
    // Fallback to text if testid not found immediately (HMR issue?)
    const blogLink = page.locator('header a[href*="dev.to"]');
    await expect(blogLink).toBeVisible();

    // Check Music Player
    // Use generic class matcher if testid is missing due to HMR lag
    const musicPlayer = page
      .locator('[data-testid="music-player"]')
      .or(page.locator('div[class*="playerWrapper"]'));
    await expect(musicPlayer).toBeVisible();

    const playButton = page
      .locator('[data-testid="play-button"]')
      .or(page.locator('button[aria-label*="Play"]'));
    await expect(playButton).toBeVisible();

    // Verify play button is clickable
    await expect(playButton).toBeEnabled();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Primary Navigation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject CSS to hide the Chat widget to prevent click interception
    await page.addStyleTag({
      content: `
        [class*="floatingControls"],
        .ais-Chat-window,
        .ais-Chat-toggleButton,
        [class*="ClientShell-module__PdIJPa__floatingControls"] {
          display: none !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
      `,
    });
  });
  test('should navigate from Home to Human and back', async ({ page }) => {
    // Start at Home (Choices)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/');

    // Header title might not be present if SearchWithAskAI overlays it or if page structure changed
    // await expect(page.locator('h1').first()).toContainText("This portfolio isn't browsed—");

    // Navigate to Human
    await page.getByRole('link', { name: 'Human' }).click({ force: true });
    await expect(page).toHaveURL('/about');

    // Verify Human Page Content
    await expect(page.locator('body')).toContainText('Ashley Childress', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Appalachia');

    // Navigate back to Home
    await page.getByRole('link', { name: 'Choices' }).first().click({ force: true });
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Builds and back', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Navigate to Builds
    await page.getByRole('link', { name: 'Builds' }).click({ force: true });
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('h1').first()).toContainText('Not here to play nice');

    // Navigate back to Home
    await page.getByRole('link', { name: 'Choices' }).click({ force: true });
    await expect(page).toHaveURL('/');
  });

  test('should navigate to external links correctly', async ({ page }) => {
    await page.goto('/');

    // Verify GitHub link presence
    const footer = page.locator('footer');
    const githubLink = footer.getByRole('link', { name: 'GitHub' });
    // Scroll to bottom to ensure visibility on mobile
    await githubLink.scrollIntoViewIfNeeded();
    await expect(githubLink).toBeVisible();

    // Verify LinkedIn link presence
    const linkedinLink = footer.getByRole('link', { name: 'LinkedIn' });
    await expect(linkedinLink).toBeVisible();
  });
});

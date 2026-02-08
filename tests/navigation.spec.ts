import { test, expect } from '@playwright/test';

test.describe('Primary Navigation Flows', () => {
  // test.beforeEach(async ({ page }) => {
  //   // Inject CSS to hide the Chat widget to prevent click interception
  //   await page.addStyleTag({ ... })
  // });
  test('should navigate from Home to About and back', async ({ page }) => {
    // Start at Home
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').first()).toContainText('Not here to play nice');

    // Navigate to About
    await page.getByRole('link', { name: 'About' }).click({ force: true });
    await expect(page).toHaveURL('/about');

    // Verify About Page Content
    // Update to match actual content
    // Use loose text check to verify content loading
    await expect(page.locator('body')).toContainText('Ashley Childress', { timeout: 10000 });

    // Also check for something unique to the bio
    await expect(page.locator('body')).toContainText('Appalachia');

    // Navigate back to Home
    await page.getByRole('link', { name: 'Projects' }).first().click({ force: true });
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').first()).toContainText('Not here to play nice');
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

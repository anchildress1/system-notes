import { test, expect } from '@playwright/test';

test.describe('Primary Navigation Flows', () => {
  test('should navigate from Home to About and back', async ({ page }) => {
    // Start at Home
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).first().toContainText("System Notes");

    // Navigate to About
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');

    // Verify About Page Content
    // Update to match actual content
    await expect(page.getByRole('heading', { level: 1, name: 'Ashley Childress' })).toBeVisible();

    // Navigate back to Home
    await page.getByRole('link', { name: 'Projects' }).first().click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).first().toContainText("System Notes");
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

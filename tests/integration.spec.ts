import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('System Notes Integration', () => {
  test('should load the homepage with correct metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ashley Childress' System Notes/);
    await expect(page.locator('h1')).toContainText("Ashley Childress' System Notes");
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Built with Gemini 3 Pro');
  });

  test('should display blog CTA in header', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: 'Read My Blog' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', 'https://dev.to/anchildress1');
    // Check if it's on the right side if possible (via CSS or order)
  });

  test('should load projects with simple tags', async ({ page }) => {
    await page.goto('/');
    // Wait for projects
    const projectCard = page.locator('div[class*="card"]').first();
    await expect(projectCard).toBeVisible();

    // Check for Simple Tag (no role)
    const simpleTag = page.locator('span[class*="simpleTag"]').first();
    await expect(simpleTag).toBeVisible();
    // Role should NOT be visible text directly in the tag as separate element
    const roleBadge = page.locator('span[class*="techRole"]');
    await expect(roleBadge).toHaveCount(0); // Should be 0 in primary view
  });

  test('accessibility accessiblity check', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('AIChat interaction', async ({ page }) => {
    await page.goto('/');
    // Open Chat
    const toggle = page.getByLabel('Open AI Chat');
    await toggle.click();

    const input = page.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible();

    await input.fill('Hello AI');
    await page.keyboard.press('Enter');

    // Check for "Thinking..." state
    await expect(page.locator('text=Thinking...')).toBeVisible();
  });

  test('should open expanded view and verify banner', async ({ page }) => {
    await page.goto('/');
    // Click first card
    await page.locator('div[class*="card"]').first().click();

    // Check for banner container
    // Use a more specific locator to avoid matching Project Cards
    const banner = page.locator('div[class*="ExpandedView"] div[class*="imageContainer"]');
    await expect(banner).toBeVisible();

    // Check for "Project Output" or similar text to ensure content loaded
    // Verify content loaded - check for specific section title within expanded view
    const expandedContent = page.locator('div[class*="ExpandedView"] h3').filter({ hasText: /Project Output|Outcome/ }).first();
    await expect(expandedContent).toBeVisible();
  });
});

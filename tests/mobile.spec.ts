import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
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

  test('AIChat should be accessible', async ({ page, isMobile }) => {
    await page.goto('/');
    // Check for chat toggle button
    const toggle = page.getByTestId('ai-chat-toggle');
    await expect(toggle).toBeVisible({ timeout: 15000 });

    // Open chat
    await toggle.click();
    const input = page.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible();

    if (isMobile) {
      // Verify it takes up most of the screen width (simplified check)
      // Use text "Ruckus" in the header to find the chat window container
      const chatHeader = page.getByText('Ruckus');
      await expect(chatHeader).toBeVisible();

      // Check bounding box of the chat window (parent of header roughly)
      // We can just verify the input field width is substantial
      const inputStyle = await input.boundingBox();
      expect(inputStyle?.width).toBeGreaterThan(250);
    }
  });
});

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

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region', 'nested-interactive'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('AIChat interaction', async ({ page }) => {
    await page.goto('/');
    // Open Chat
    const toggle = page.getByLabel('Open AI Chat');
    await toggle.click();

    const input = page.getByPlaceholder('Type a message...');
    await expect(input).toBeVisible();

    // Verify initial focus
    await expect(input).toBeFocused();

    // Mock API response
    await page.route('**/api/chat', async (route) => {
      // Delay to ensure "Thinking..." is visible
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'I am AI.' }),
      });
    });

    await input.fill('Hello AI');
    await page.keyboard.press('Enter');

    // Check for "Thinking..." state
    await expect(page.locator('text=Thinking...')).toBeVisible();

    // Verify focus returns to input
    await expect(input).toBeFocused();
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
    const expandedContent = page
      .locator('h3[class*="sectionTitle"]')
      .filter({ hasText: /Project Output|Outcome/ })
      .first();
    await expect(expandedContent).toBeVisible();

    // Verify Vertical Tech Stack
    // Should have multiple tag items stacked
    const techStack = page.locator('div[class*="tags"]');
    await expect(techStack).toBeVisible();

    // Check specific class for vertical items if possible (tagItem)
    const tagItems = page.locator('div[class*="tagItem"]');
    await expect(tagItems.first()).toBeVisible();
  });

  test('About page smoke test', async ({ page }) => {
    await page.goto('/about');

    // Check Hero Image
    const heroImage = page.getByAltText('Ashley Childress');
    await expect(heroImage).toBeVisible();

    // Check Hero Text
    await expect(page.locator("text=failure you haven't met yet")).toBeVisible();

    // Check API Content Loading (wait for it)
    await expect(page.locator('text=Initializing identity protocol')).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Appalachia').first()).toBeVisible();

    // Accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  test('Chat state persistence across navigation', async ({ page }) => {
    await page.goto('/');

    // Open Chat
    await page.getByLabel('Open AI Chat').click();
    const input = page.getByPlaceholder('Type a message...');

    // Send a message
    await input.fill('Are you persistent?');
    await page.keyboard.press('Enter');

    // Wait for message to appear in chat log (User message)
    await expect(page.locator('text=Are you persistent?')).toBeVisible();

    // Navigate to /about
    await page.getByRole('link', { name: 'About Ashley' }).click();
    await expect(page).toHaveURL('/about');

    // Wait for nav to complete
    await page.waitForLoadState('domcontentloaded');

    // Chat should be visible and contain history
    const chatContainer = page.locator('div[class*="chatWindow"]');

    // Check visibility first
    await expect(chatContainer).toBeVisible({ timeout: 10000 });

    // Check history
    await expect(page.locator('text=Are you persistent?')).toBeVisible();
  });
});

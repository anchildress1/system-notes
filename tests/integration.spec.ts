import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { test } from './utils';

test.describe('System Notes Integration', () => {
  test('loads homepage with correct metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Choices');
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      "This portfolio isn't browsed—"
    );
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(
      'Built with GitHub Copilot, ChatGPT, Verdent, Claude + Gemini'
    );
  });

  test('should display blog CTA in header', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: 'Read My Blog' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', 'https://dev.to/anchildress1');
  });

  test('should load projects with loadout grid', async ({ page }) => {
    await page.goto('/projects');
    const projectCard = page.locator('div[class*="card"]').first();
    await expect(projectCard).toBeVisible();

    // Loadout badges show tech name + role
    const loadoutBadge = page.locator('div[class*="loadoutBadge"]').first();
    await expect(loadoutBadge).toBeVisible();

    const techName = page.locator('span[class*="techName"]').first();
    await expect(techName).toBeVisible();
  });

  test('should open expanded view and verify content', async ({ page }) => {
    await page.goto('/projects');
    await page
      .getByTestId(/^project-card-/)
      .first()
      .click();

    // Section titles use h3 elements
    const expandedContent = page
      .locator('h3[class*="sectionTitle"]')
      .filter({ hasText: /Project Output|Outcome|Purpose/ })
      .first();
    await expect(expandedContent).toBeVisible();

    // Verify tech stack in the expanded view
    const modal = page.getByTestId('expanded-view-dialog');
    const techStack = modal.locator('div[class*="tags"]');
    await expect(techStack).toBeVisible();

    const tagItems = modal.locator('div[class*="tagItem"]');
    await expect(tagItems.first()).toBeVisible();
  });

  test('expanded view closes on Escape', async ({ page }) => {
    await page.goto('/projects');
    await page
      .getByTestId(/^project-card-/)
      .first()
      .click();

    const modal = page.getByTestId('expanded-view-dialog');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Human page smoke test', async ({ page }) => {
    await page.goto('/about');

    // Check Hero Image
    const heroImage = page.getByAltText('Ashley Childress');
    await expect(heroImage).toBeVisible();

    // Check Hero Text
    await expect(page.getByRole('heading', { name: 'Designing for the failures' })).toBeVisible();

    // Check API Content Loading (wait for it)
    await expect(page.locator('text=Initializing identity protocol')).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Appalachia').first()).toBeVisible();

    // Chat toggle only renders when Algolia credentials are configured.
    // Verify a11y label when present; skip gracefully otherwise.
    const chatToggle = page.locator('.ais-ChatToggleButton');
    const toggleVisible = await chatToggle.isVisible().catch(() => false);
    if (toggleVisible) {
      await expect(chatToggle).toHaveAttribute('aria-label', 'Open AI Chat');
    }

    // Accessibility check (exclude chat toggle area since widget may not load)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .exclude('.ais-ChatToggleButton')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('clicking project link in builds page navigates with hash', async ({ page }) => {
    await page.goto('/projects');

    // Click first project card
    const firstCard = page.getByTestId(/^project-card-/).first();
    await firstCard.click();

    // Verify hash is written
    await expect(page).toHaveURL(/#project=.+/);

    // Verify modal opens
    const modal = page.getByTestId('expanded-view-dialog');
    await expect(modal).toBeVisible();
  });

  test('navigating to app_url from external source opens modal', async ({ page }) => {
    // Simulate arriving at the site with a hash
    await page.goto('/projects#project=system-notes');

    // Verify modal opens
    const modal = page.getByTestId('expanded-view-dialog');
    await expect(modal).toBeVisible();

    // Verify correct project loaded (use modal-scoped heading)
    await expect(modal.getByRole('heading', { name: 'System Notes' })).toBeVisible();
  });
});

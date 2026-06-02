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

  test('flips a project card in place to reveal the note', async ({ page }) => {
    await page.goto('/projects');
    const toggle = page.getByRole('button', { name: /flip to read the project note/i }).first();
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The back face is now showing — its close affordance and source link are reachable.
    await expect(page.getByRole('button', { name: /back to summary/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /view source/i }).first()).toBeVisible();
  });

  test('flips a card back on Escape', async ({ page }) => {
    await page.goto('/projects');
    const toggle = page.getByRole('button', { name: /flip to read the project note/i }).first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
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

  test('flipping a project card does not change the URL', async ({ page }) => {
    await page.goto('/projects');
    const url = page.url();

    const toggle = page.getByRole('button', { name: /flip to read the project note/i }).first();
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(page.url()).toBe(url);
  });
});

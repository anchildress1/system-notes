import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { test } from './utils';

test.describe('System Notes Integration', () => {
  test('loads homepage with correct metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Choices');
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      "This portfolio isn't browsed."
    );
    await expect(page.getByText('An engineering portfolio you query, not scroll.')).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(
      'Built with GitHub Copilot, ChatGPT, Verdent, Claude + Gemini'
    );
  });

  test('should expose the blog CTA contract in the header', async ({ page, isMobile }) => {
    await page.goto('/');
    const cta = page.getByTestId('blog-link');
    if (isMobile) {
      await expect(cta).toBeHidden();
    } else {
      await expect(cta).toBeVisible();
    }
    await expect(cta).toHaveAttribute('href', 'https://dev.to/anchildress1');
    await expect(cta).toContainText('$ read --blog');
  });

  test('should load projects with current summary card metadata', async ({ page }) => {
    await page.goto('/projects');
    const projectCard = page.getByTestId(/^project-card-/).first();
    await expect(projectCard).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      'Things I built and broke.'
    );
    await expect(
      projectCard.getByRole('button', { name: /flip to read the project note/i })
    ).toBeVisible();
    const summaryTags = projectCard.locator('span[data-variant="solid"]');
    await expect(summaryTags.filter({ hasText: /^Canvas 2D$/ })).toBeVisible();
    await expect(summaryTags.filter({ hasText: /^PixiJS$/ })).toBeVisible();
  });

  test('flips a project card in place to reveal the note', async ({ page }) => {
    await page.goto('/projects');
    const card = page.getByTestId(/^project-card-/).first();
    const toggle = card.locator('button[aria-label*="Flip to read the project note"]').first();
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The back face is now showing — its close affordance and source link are reachable.
    await expect(page.getByRole('button', { name: /back to summary/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /view source/i }).first()).toBeVisible();
  });

  test('flips a card back on Escape', async ({ page }) => {
    await page.goto('/projects');
    const card = page.getByTestId(/^project-card-/).first();
    const toggle = card.locator('button[aria-label*="Flip to read the project note"]').first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Human page smoke test', async ({ page }) => {
    await page.goto('/about');

    const heroImage = page.getByAltText(/Ashley Childress profile picture/i);
    await expect(heroImage).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Designing for the failures you haven't met yet/i })
    ).toBeVisible();

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

    const card = page.getByTestId(/^project-card-/).first();
    const toggle = card.locator('button[aria-label*="Flip to read the project note"]').first();
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(page.url()).toBe(url);
  });
});

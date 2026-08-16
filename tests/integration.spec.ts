import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openFirstProjectCard, test } from './utils';

test.describe('System Notes Integration', () => {
  test('loads homepage with correct metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Builds');
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      'Things I built and broke.'
    );
    await expect(page.getByText(/a senior software engineer who builds AI systems/)).toBeVisible();
    const buildsCta = page.locator('main').getByRole('link', { name: /query the index/i });
    await expect(buildsCta).toHaveAttribute('href', '/choices');
    await expect(buildsCta).toHaveAttribute('data-variant', 'primary');
    const ctaStyles = await buildsCta.evaluate((node) => {
      const styles = getComputedStyle(node);
      return {
        background: styles.backgroundImage,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      };
    });
    expect(ctaStyles.background).not.toContain('185, 107, 255');
    expect(ctaStyles.backgroundColor).not.toContain('185, 107, 255');
    expect(ctaStyles.color).toBe('rgb(23, 19, 33)');

    if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
      await buildsCta.hover();
      const hoverBackground = await buildsCta.evaluate((node) => getComputedStyle(node).background);
      expect(hoverBackground).toContain('rgb(255, 255, 255)');
    }
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("ASHLEY'S SYSTEM NOTES");
    await expect(footer).toContainText('/sys/choices');
    await expect(footer).toContainText('Powered by');
    await expect(footer).not.toContainText('Built with');
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
    await expect(cta).toHaveAttribute('data-variant', 'primary');
    await expect(cta).toContainText('$ read --blog');
  });

  test('should load projects with current summary card metadata', async ({ page }) => {
    await page.goto('/');
    const projectCard = page.getByTestId('project-card-carbon-trace');
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
    const { card } = await openFirstProjectCard(page);

    await expect(card.getByRole('button', { name: /back to summary/i })).toBeVisible();
    await expect(card.getByRole('link', { name: /view source/i })).toBeVisible();
  });

  test('flips a card back on Escape', async ({ page }) => {
    const { toggle } = await openFirstProjectCard(page);

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Human page smoke test', async ({ page }) => {
    await page.goto('/human');

    const heroImage = page.getByAltText(/Ashley Childress profile picture/i);
    await expect(heroImage).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Designing for the failures you haven't met yet/i })
    ).toBeVisible();

    await expect(page.locator('text=Initializing identity protocol')).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Appalachia').first()).toBeVisible();

    const chatToggle = page.locator('.ais-ChatToggleButton');
    const toggleVisible = await chatToggle.isVisible().catch(() => false);
    if (toggleVisible) {
      await expect(chatToggle).toHaveAttribute('aria-label', 'Open AI Chat');
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['region'])
      .exclude('.ais-ChatToggleButton')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('flipping a project card does not change the URL', async ({ page }) => {
    const { url } = await openFirstProjectCard(page);

    expect(page.url()).toBe(url);
  });
});

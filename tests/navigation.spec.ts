import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Primary Navigation Flows', () => {
  test('should navigate from Home to About and back', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');

    await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .getByRole('link', { name: 'Human' })
      .click();
    await expect(page).toHaveURL('/human');

    await expect(page.locator('body')).toContainText('Ashley Childress', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Appalachia');

    await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .getByRole('link', { name: 'Builds' })
      .click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Choices and back', async ({ page }) => {
    await page.goto('/');

    const choicesLink = page
      .getByRole('navigation', { name: 'Main Navigation' })
      .getByRole('link', { name: 'Choices' });
    await expect(choicesLink).toHaveAttribute('href', '/choices');
    await Promise.all([page.waitForURL('/choices'), choicesLink.click()]);
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      "This portfolio isn't browsed."
    );

    await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .getByRole('link', { name: 'Builds' })
      .click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to external links correctly', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    const githubLink = footer.getByRole('link', { name: /github/i });
    await githubLink.scrollIntoViewIfNeeded();
    await expect(githubLink).toBeVisible();

    const linkedinLink = footer.getByRole('link', { name: /linkedin/i });
    await expect(linkedinLink).toBeVisible();
  });
});

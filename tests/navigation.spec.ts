import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('Primary Navigation Flows', () => {
  test('should navigate from Home to About and back', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');

    await page.getByRole('link', { name: 'Human' }).click();
    await expect(page).toHaveURL('/about');

    await expect(page.locator('body')).toContainText('Ashley Childress', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Appalachia');

    await page.getByRole('link', { name: 'Choices' }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Builds and back', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Builds' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('h1').first()).toContainText('Not here to play nice');

    await page.getByRole('link', { name: 'Choices' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to external links correctly', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    const githubLink = footer.getByRole('link', { name: 'GitHub' });
    await githubLink.scrollIntoViewIfNeeded();
    await expect(githubLink).toBeVisible();

    const linkedinLink = footer.getByRole('link', { name: 'LinkedIn' });
    await expect(linkedinLink).toBeVisible();
  });
});

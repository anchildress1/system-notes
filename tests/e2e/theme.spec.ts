import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from './utils';

const ROUTES = ['/', '/notes', '/projects', '/about'] as const;

// WebKit is excluded from this file by testIgnore on the Mobile Safari project
// rather than by a runtime skip, so the spec never collects there instead of
// collecting and reporting as skipped. The reason lives with the exclusion.
test.describe('Theme', () => {
  test.describe('resolved from the system preference', () => {
    for (const scheme of ['dark', 'light'] as const) {
      test.describe(`${scheme} preference`, () => {
        test.use({ colorScheme: scheme });

        test(`stamps ${scheme} before the first paint`, async ({ page }) => {
          await page.goto('/');

          // Stamped by the blocking head script, so it is already correct on the
          // first paint rather than corrected after hydration.
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
        });

        test(`shows the ${scheme} portrait on the about page`, async ({ page }) => {
          await page.goto('/about');

          const shown = page.locator('[data-theme-image]:visible');
          await expect(shown).toHaveCount(1);
          await expect(shown).toHaveAttribute('data-theme-image', scheme);
        });

        for (const route of ROUTES) {
          test(`${route} has no accessibility violations in ${scheme}`, async ({ page }) => {
            await page.goto(route);

            const accessibility = await new AxeBuilder({ page }).analyze();
            expect(accessibility.violations).toEqual([]);
          });
        }
      });
    }
  });

  test.describe('chosen by the reader', () => {
    test.use({ colorScheme: 'dark' });

    test('overrides the system preference and survives a reload', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      await page.getByRole('button', { name: 'Light theme' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );

      // The stored choice has to beat the system preference on the next visit,
      // and it has to win before the first paint rather than after it.
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });

    test('repaints the browser chrome with the page', async ({ page }) => {
      await page.goto('/');
      const meta = page.locator('meta[name="theme-color"]');
      await expect(meta).toHaveAttribute('content', '#0b0c0f');

      await page.getByRole('button', { name: 'Light theme' }).click();

      await expect(meta).toHaveAttribute('content', '#f7f6f2');
    });

    test('swaps theme tokens without transitioning through a mixed palette', async ({ page }) => {
      await page.goto('/');

      const repaint = await page.evaluate(() => {
        const toggle = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Light theme"]'
        );
        if (!toggle) return null;
        toggle.click();
        return {
          switching: document.documentElement.hasAttribute('data-theme-switching'),
          transitionDuration: getComputedStyle(toggle).transitionDuration,
        };
      });

      expect(repaint).toEqual({ switching: true, transitionDuration: '0s' });
      await expect.poll(() => page.locator('html').getAttribute('data-theme-switching')).toBeNull();
    });

    test('carries the choice across a navigation', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Light theme' }).click();

      await page.getByRole('link', { name: 'how I decide' }).click();
      await expect(page).toHaveURL('/notes');

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
  });
});

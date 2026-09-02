import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('WebKit compatibility', () => {
  test('keeps the portfolio navigation and theme control usable', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    const initialTheme = await page.locator('html').getAttribute('data-theme');

    await navigation.getByRole('link', { name: 'what I’ve shipped' }).click();
    await expect(page).toHaveURL('/projects');
    await page.getByRole('button', { name: 'Light theme' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', initialTheme ?? '');
    await expect(page.getByTestId('exhibit-save-the-sun')).toBeVisible();
  });
});

test.describe('project exhibit motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('animates every exhibit layer in supported desktop engines', async ({
    browserName,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/projects');

    const catalogue = page.getByRole('region', { name: 'Selected exhibits' });
    const exhibit = page.locator('[data-testid^="exhibit-"]').nth(1);
    const parts = [
      exhibit.locator('[data-motion-part="copy"]').first(),
      exhibit.locator('[data-motion-part="media"]'),
      exhibit.locator('[data-motion-part="copy"]').last(),
      exhibit.locator('[data-motion-part="references"]'),
    ];

    await expect(exhibit).toBeVisible();

    if (browserName === 'firefox') {
      await expect(catalogue).toHaveAttribute('data-motion-fallback', 'true');

      for (const part of parts) {
        await expect(part).toHaveAttribute('data-motion-state', 'waiting');
      }
    } else {
      await expect(catalogue).not.toHaveAttribute('data-motion-fallback', 'true');

      for (const part of parts) {
        await expect
          .poll(() => part.evaluate((element) => getComputedStyle(element).animationName))
          .not.toBe('none');
      }
    }

    for (const part of parts) {
      await part.evaluate((element) => {
        const top = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top - window.innerHeight * 0.45);
      });

      if (browserName === 'firefox') {
        await expect(part).toHaveAttribute('data-motion-state', 'arrived');
      }

      await expect
        .poll(() =>
          part.evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.translate}|${style.scale}`;
          })
        )
        .toMatch(/^(0px|none)\|(1|none)$/);
    }

    const media = page.locator('[data-testid^="exhibit-"] [data-motion-part="media"]');
    const firstTilt = await media.first().evaluate((element) => getComputedStyle(element).rotate);
    const secondTilt = await media.nth(1).evaluate((element) => getComputedStyle(element).rotate);

    expect(firstTilt).toBe('1.2deg');
    expect(secondTilt).toBe('-1.2deg');
  });

  test('removes exhibit motion when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects');

    const catalogue = page.getByRole('region', { name: 'Selected exhibits' });
    const part = page.locator('[data-motion-part]').first();

    await expect(catalogue).not.toHaveAttribute('data-motion-fallback', 'true');
    await expect
      .poll(() => part.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('none');
  });
});

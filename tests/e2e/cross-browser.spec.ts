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

  test('animates every exhibit layer in supported desktop engines', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/projects');
    await page.locator('html').evaluate((element) => {
      element.style.scrollBehavior = 'auto';
    });

    const catalogue = page.getByRole('region', { name: 'Selected exhibits' });
    const exhibit = page.locator('[data-testid^="exhibit-"]').nth(1);
    const parts = [
      exhibit.locator('[data-motion-part="copy"]').first(),
      exhibit.locator('[data-motion-part="media"]'),
      exhibit.locator('[data-motion-part="copy"]').last(),
      exhibit.locator('[data-motion-part="references"]'),
    ];

    await expect(exhibit).toBeVisible();

    // The component keys off the feature, not the engine. Branching on the
    // browser name instead would fail a correct implementation the day Firefox
    // ships scroll timelines, and blame the wrong thing if WebKit regressed.
    const hasScrollTimeline = await page.evaluate(() => CSS.supports('animation-timeline: view()'));

    if (!hasScrollTimeline) {
      await expect(catalogue).toHaveAttribute('data-motion-fallback', 'true');
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

      await expect
        .poll(() =>
          part.evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.translate}|${style.scale}`;
          })
        )
        .toMatch(/^(0px|none)\|(1|none)$/);

      await part.evaluate((element) => {
        const top = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top - window.innerHeight * 0.82);
      });
      await expect
        .poll(() =>
          part.evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.translate}|${style.scale}`;
          })
        )
        .not.toMatch(/^(0px|none)\|(1|none)$/);
      const partialStyle = await part.evaluate((element) => {
        const style = getComputedStyle(element);
        return `${style.translate}|${style.scale}`;
      });

      await part.evaluate((element) => {
        const top = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top - window.innerHeight * 0.78);
      });
      await expect
        .poll(() =>
          part.evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.translate}|${style.scale}`;
          })
        )
        .not.toBe(partialStyle);
    }

    const media = page.locator('[data-testid^="exhibit-"] [data-motion-part="media"]');
    const firstTilt = await media.first().evaluate((element) => getComputedStyle(element).rotate);
    const secondTilt = await media.nth(1).evaluate((element) => getComputedStyle(element).rotate);

    expect(firstTilt).toBe('1.2deg');
    expect(secondTilt).toBe('-1.2deg');
  });

  test('presses each tape edge flat at the same scroll position', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/projects');
    await page.locator('html').evaluate((element) => {
      element.style.scrollBehavior = 'auto';
    });

    const media = page.locator('[data-testid^="exhibit-"] [data-motion-part="media"]');

    for (const print of [media.first(), media.nth(1)]) {
      const turnAt = async (
        pseudo: '::before' | '::after',
        edge: 'top' | 'bottom',
        viewportRatio: number
      ) => {
        await print.evaluate(
          (element, position) => {
            const bounds = element.getBoundingClientRect();
            const edgePosition = position.edge === 'top' ? bounds.top : bounds.bottom;
            window.scrollTo(
              0,
              edgePosition + window.scrollY - window.innerHeight * position.viewportRatio
            );
          },
          { edge, viewportRatio }
        );
        await page.waitForTimeout(50);
        return print.evaluate(
          (element, selectedPseudo) =>
            Number.parseFloat(
              element.style.getPropertyValue(
                selectedPseudo === '::before' ? '--tape-before-turn' : '--tape-after-turn'
              )
            ),
          pseudo
        );
      };

      const beforeLifted = await turnAt('::before', 'top', 0.58);
      const beforePlaced = await turnAt('::before', 'top', 0.18);
      const beforeLater = await turnAt('::before', 'top', 0.05);
      expect(Math.abs(beforeLifted)).toBeGreaterThan(0);
      expect(beforePlaced).toBe(0);
      expect(beforeLater).toBe(0);

      const afterLifted = await turnAt('::after', 'bottom', 1.05);
      const afterPlaced = await turnAt('::after', 'bottom', 0.82);
      const afterLater = await turnAt('::after', 'bottom', 0.5);
      expect(Math.abs(afterLifted)).toBeGreaterThan(0);
      expect(afterPlaced).toBe(0);
      expect(afterLater).toBe(0);
    }
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

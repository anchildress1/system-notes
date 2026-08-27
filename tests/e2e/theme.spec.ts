import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, test } from './utils';

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
            // Contrast is the one part of the theme that is engine-independent —
            // it is custom properties and an attribute — and WebKit cannot be
            // asked anyway, since it reports oklch back as lab() and axe misreads
            // it. Everything else in this file is behaviour and runs everywhere.
            test.skip(test.info().project.name !== 'chromium', 'palette is engine-independent');
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

  /* Windows High Contrast is what Edge and Chrome render on that platform, and
     it discards exactly the two properties the board is drawn with: every
     background-color flattens to Canvas and box-shadow is dropped outright.
     Measured before the fix: 3 of the 4 tile kinds became invisible holes in the
     grid that were still clickable, and the selected ring went with them. */
  test.describe('forced colors', () => {
    test.skip(
      ({ browserName }) => browserName !== 'chromium',
      'only the engine Edge ships emulates forced colors'
    );
    test.use({ contextOptions: { forcedColors: 'active' } });

    test('keeps every board tile drawn and the selected one apart', async ({ page }) => {
      await mockAlgoliaSearch(
        page,
        ['Principle', 'Architecture', 'Decision', 'Award'].flatMap((category, kind) =>
          Array.from({ length: 3 }, (_, index) => ({
            objectID: `card:${category}:${index}`,
            title: `${category} note ${index}`,
            fact: 'The complete decision.',
            category,
            projects: ['System Notes'],
            __position: kind * 3 + index + 1,
          }))
        )
      );
      await page.goto('/notes');
      await page.locator('[data-note-board] li').first().waitFor();

      const tiles = await page.evaluate(() =>
        [...document.querySelectorAll('[data-note-board] li')].map((tile) => {
          const swatch = getComputedStyle(tile, '::before');
          return {
            selected: tile.getAttribute('aria-selected') === 'true',
            outlineStyle: swatch.outlineStyle,
            outlineWidth: swatch.outlineWidth,
          };
        })
      );

      expect(tiles.length).toBeGreaterThan(0);
      // An outline is the only edge forced colors keeps, so every tile has to
      // carry one. Which colour the system paints it is the reader's business.
      expect(tiles.filter((tile) => tile.outlineStyle === 'none')).toEqual([]);

      const selected = tiles.find((tile) => tile.selected);
      expect(selected).toBeDefined();
      expect(
        tiles.some((tile) => !tile.selected && tile.outlineWidth !== selected!.outlineWidth)
      ).toBe(true);
    });
  });
});

import { expect } from '@playwright/test';
import { test } from './utils';

test('loads only the light portrait on a fresh light-theme visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const portraits: string[] = [];
  page.on('request', (request) => {
    if (/\/opt\/profile-(dark|light)-\d+\.webp/.test(request.url())) {
      portraits.push(request.url());
    }
  });

  await page.goto('/about');
  const portrait = page.locator('[data-theme-image="light"] img');
  await portrait.scrollIntoViewIfNeeded();
  await portrait.evaluate((image: HTMLImageElement) => image.decode());

  expect(portraits.filter((url) => url.includes('profile-light'))).toHaveLength(1);
  expect(portraits.some((url) => url.includes('profile-dark'))).toBe(false);
});

for (const { source, target, label, intent } of [
  { source: '/projects', target: '/about', label: 'about me', intent: 'hover' },
  { source: '/about', target: '/', label: 'Ashley Childress', intent: 'focus' },
  { source: '/', target: '/projects', label: 'See the evidence.', intent: 'focus' },
]) {
  test(`prefetches ${label} only after ${intent}`, async ({ page }) => {
    const prefetched: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.searchParams.has('_rsc')) prefetched.push(url.pathname);
    });
    await page.goto(source);
    const link = page.getByRole('link', { name: label, exact: true });
    // Next schedules automatic prefetch during idle time after hydration;
    // wait for the link to hydrate before asserting none has fired yet.
    await expect(link).toBeVisible();
    expect(prefetched).not.toContain(target);

    if (intent === 'hover') await link.hover();
    else await link.focus();

    await expect.poll(() => prefetched).toContain(target);
    await link.click();
    await expect(page).toHaveURL(target);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
  });
}

for (const width of [412, 880, 881, 1097, 1440]) {
  for (const deviceScaleFactor of [1, 2]) {
    test.describe(`About portrait at ${width}px and DPR ${deviceScaleFactor}`, () => {
      test.use({ viewport: { width, height: 900 }, deviceScaleFactor, colorScheme: 'dark' });

      test('loads the fitting variant and defers the other theme until selected', async ({
        page,
      }) => {
        const images: string[] = [];
        page.on('request', (request) => {
          if (/\/opt\/profile-(dark|light)-\d+\.webp/.test(request.url())) {
            images.push(request.url());
          }
        });
        await page.goto('/about');
        const portrait = page.locator('[data-theme-image="dark"] img');
        await portrait.scrollIntoViewIfNeeded();
        await portrait.evaluate((image: HTMLImageElement) => image.decode());

        const sizing = await portrait.evaluate((image: HTMLImageElement) => {
          const widths = image.srcset.split(',').map((candidate) => {
            const [src, descriptor] = candidate.trim().split(/\s+/);
            return { src, width: Number.parseInt(descriptor) };
          });

          // `sizes` is a hand-written approximation of the box's CSS width,
          // evaluated once by the browser when it picks a srcset candidate.
          // image.clientWidth measures a *different* thing — the box's real
          // rendered width — and the two aren't guaranteed to agree exactly;
          // CI's scrollbar reservation nudges them apart by enough to cross
          // a ladder rung even once fonts and layout are fully settled.
          // Evaluate the sizes attribute's own expression instead, the way
          // the HTML spec says a UA must: as a `width` value under its
          // matching media condition.
          // A plain split(',') also breaks on the commas inside min()/calc()
          // argument lists, so the branch split has to track paren depth.
          const splitTopLevel = (value: string): string[] => {
            const parts: string[] = [];
            let depth = 0;
            let current = '';
            for (const char of value) {
              if (char === '(') depth += 1;
              else if (char === ')') depth -= 1;
              if (char === ',' && depth === 0) {
                parts.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            parts.push(current.trim());
            return parts;
          };

          // A leading media condition is itself parenthesized, so pulling it
          // off with a greedy regex over-matches into the nested min()/calc()
          // that follows — same paren-depth problem as the comma split above.
          const extractCondition = (branch: string): [string, string] | null => {
            if (branch[0] !== '(') return null;
            let depth = 0;
            for (let i = 0; i < branch.length; i += 1) {
              if (branch[i] === '(') depth += 1;
              else if (branch[i] === ')') {
                depth -= 1;
                if (depth === 0) return [branch.slice(0, i + 1), branch.slice(i + 1).trim()];
              }
            }
            return null;
          };

          const sizesList = splitTopLevel(image.getAttribute('sizes')!);
          const fallback = sizesList[sizesList.length - 1];
          let sourceSize = fallback;
          for (const branch of sizesList.slice(0, -1)) {
            const parsed = extractCondition(branch);
            if (parsed && window.matchMedia(parsed[0]).matches) {
              sourceSize = parsed[1];
              break;
            }
          }

          const probe = document.createElement('div');
          probe.style.cssText = `position: fixed; visibility: hidden; height: 0; width: ${sourceSize};`;
          document.body.appendChild(probe);
          const requiredWidth = probe.getBoundingClientRect().width * devicePixelRatio;
          probe.remove();

          const fitting = widths.find(({ width }) => width >= requiredWidth) ?? widths.at(-1)!;
          return { actual: new URL(image.currentSrc).pathname, expected: fitting.src };
        });
        expect(sizing.actual).toBe(sizing.expected);
        expect(images.filter((url) => url.includes('profile-dark'))).toHaveLength(1);
        expect(images.some((url) => url.includes('profile-light'))).toBe(false);

        await page.getByRole('button', { name: 'Light theme', exact: true }).click();
        const lightPortrait = page.locator('[data-theme-image="light"] img');
        await lightPortrait.scrollIntoViewIfNeeded();
        await expect(lightPortrait).toBeVisible();
        await lightPortrait.evaluate((image: HTMLImageElement) => image.decode());
        await expect(portrait).not.toBeVisible();
        expect(images.filter((url) => url.includes('profile-light'))).toHaveLength(1);
      });
    });
  }
}

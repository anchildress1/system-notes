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
          const requiredWidth = image.clientWidth * devicePixelRatio;
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

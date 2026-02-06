import { test, expect } from '@playwright/test';
import { injectTestStyles } from './utils';

test.describe('AI Readiness & SEO', () => {
  test.beforeEach(async ({ page }) => {
    await injectTestStyles(page);
  });
  test('should contain valid JSON-LD structure', async ({ page }) => {
    await page.goto('/');

    // Extract the JSON-LD script
    const jsonLdHandle = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdHandle).toHaveCount(1);

    const jsonLdContent = await jsonLdHandle.textContent();
    expect(jsonLdContent).toBeTruthy();

    const data = JSON.parse(jsonLdContent!);

    // Validate Schema.org structure
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebSite');
    expect(data.author['@type']).toBe('Person');
    expect(data.author.name).toBe('Ashley Childress');
    expect(data.hasPart).toBeInstanceOf(Array);
    expect(data.hasPart.length).toBeGreaterThan(0);
    expect(data.hasPart[0]['@type']).toBe('SoftwareApplication');
  });

  test('robots.txt should allow bots', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const text = (await response?.text()) ?? '';

    expect(text).toMatch(/User-agent: \*/i);
    expect(text).toContain('Allow: /');
  });
});

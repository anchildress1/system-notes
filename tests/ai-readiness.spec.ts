import { test, expect } from '@playwright/test';

test.describe('AI Readiness & SEO', () => {
  test('should allow AI bots to access the homepage', async ({ page }) => {
    // Simulate GPTBot
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Verify main content is visible to the bot
    await expect(page.getByText('Disruption is a feature')).toBeVisible();
    await expect(page.getByText('Not here to play nice')).toBeVisible();
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

    expect(text).toContain('User-agent: *');
    expect(text).toContain('Allow: /');
  });
});

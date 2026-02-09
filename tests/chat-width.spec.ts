import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('AIChat Width and Visibility', () => {
  test('chat toggle button should render with correct dimensions', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    // Inject a mock toggle button to verify CSS applies correct sizing
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.className = 'ais-Chat-toggleButton';
      btn.id = 'debug-chat-toggle';
      document.body.appendChild(btn);
    });

    const toggle = page.locator('#debug-chat-toggle');
    await expect(toggle).toBeAttached();

    const width = await toggle.evaluate((el) => window.getComputedStyle(el).width);
    const height = await toggle.evaluate((el) => window.getComputedStyle(el).height);

    // Toggle button should be 60×60 per CSS
    expect(parseFloat(width)).toBe(60);
    expect(parseFloat(height)).toBe(60);
  });
});

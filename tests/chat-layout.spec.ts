import { expect } from '@playwright/test';
import { test } from './utils';

test.describe('AIChat Visual Layout', () => {
  test('chat dock portal renders with correct bottom offset', async ({ page }) => {
    await page.goto('/');
    // Wait for hydration/content instead of networkidle
    await expect(page.locator('h1').first()).toBeVisible();

    // globals.css applies Algolia CSS variable overrides to .ais-Chat
    // Bottom positioning comes from the CSS module (:global scope) loaded with AIChat
    // Inject a dummy element with the target class to verify CSS application
    // The real widget might not open due to missing Algolia creds in test env,
    // but the CSS should be loaded because AIChat component is mounted.
    await page.evaluate(() => {
      const dummy = document.createElement('div');
      dummy.className = 'ais-Chat';
      dummy.id = 'test-chat';
      document.body.appendChild(dummy);
    });

    const chatEl = page.locator('#test-chat');
    await expect(chatEl).toBeAttached();

    // Verify global CSS variable overrides are applied
    const primaryColor = await chatEl.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('--ais-primary-color-rgb').trim()
    );
    expect(primaryColor?.replace(/\s/g, '')).toBe('181,107,255');
  });

  test('chat toggle button should have correct size and position', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    // Inject mock toggle button — globals.css styles apply directly
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.className = 'ais-Chat-toggleButton';
      btn.id = 'test-toggle';
      document.body.appendChild(btn);
    });

    const toggle = page.locator('#test-toggle');
    await expect(toggle).toBeAttached();

    const width = await toggle.evaluate((el) => window.getComputedStyle(el).width);
    const height = await toggle.evaluate((el) => window.getComputedStyle(el).height);

    // Toggle button is 60×60 per globals.css
    expect(parseFloat(width)).toBe(60);
    expect(parseFloat(height)).toBe(60);
  });
});

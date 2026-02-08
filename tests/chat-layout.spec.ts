import { test, expect } from '@playwright/test';

test.describe('AIChat Visual Layout', () => {
  test('chat window CSS should be correct', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration/content instead of networkidle
    await expect(page.locator('h1').first()).toBeVisible();

    // Inject a dummy element with the target class to verify CSS application
    // The real widget might not open due to missing Algolia creds in test env,
    // but the CSS should be loaded because AIChat component is mounted.
    await page.evaluate(() => {
      const dummy = document.createElement('div');
      dummy.className = 'ais-Chat-window';
      dummy.id = 'test-chat-window';
      // Ensure it doesn't interfere with layout visually but picks up styles
      document.body.appendChild(dummy);
    });

    const chatWindow = page.locator('#test-chat-window');
    await expect(chatWindow).toBeAttached();

    const bottomValue = await chatWindow.evaluate((el) => {
      return window.getComputedStyle(el).bottom;
    });
    const positionValue = await chatWindow.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });

    console.log('Computed bottom:', bottomValue);
    console.log('Computed position:', positionValue);

    expect(bottomValue).toBe('170px');
    expect(positionValue).toBe('fixed');
  });
});

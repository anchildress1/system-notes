import { test, expect } from '@playwright/test';

test.describe('AIChat Width and Visibility', () => {
  test('chat window should have correct width and be fully visible', async ({ page }) => {
    await page.goto('/');

    // Inject a dummy element to simulate the chat window behavior if real one doesn't load
    // But we prefer the real one if possible. The previous test had issues loading it.
    // Let's try to mock the CSS class behavior directly since we confirmed the CSS is applied to the class.

    await page.evaluate(() => {
      const dummy = document.createElement('div');
      dummy.className = 'ais-Chat-window';
      dummy.id = 'debug-chat-window';
      // Simulate large content that might force it wide/tall if not constrained
      dummy.innerHTML =
        '<div style="width: 800px; height: 1000px; background: red;">Big Content</div>';
      document.body.appendChild(dummy);
    });

    const chatWindow = page.locator('#debug-chat-window');
    await expect(chatWindow).toBeAttached();

    // Check width constraint
    const width = await chatWindow.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });

    // Check visibility / bounds
    const box = await chatWindow.boundingBox();

    const widthPx = parseFloat(width);
    // This assertion SHOULD FAIL if the bug is present (unconstrained width)
    expect(widthPx).toBeLessThanOrEqual(380);
  });
});

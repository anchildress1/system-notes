import { test, expect } from '@playwright/test';

test.describe('AIChat Visual Layout', () => {
  test('chat window CSS should be correct', async ({ page, isMobile }) => {
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
    const zIndexValue = await chatWindow.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    console.log('Computed bottom:', bottomValue);
    console.log('Computed position:', positionValue);
    console.log('Computed z-index:', zIndexValue);

    expect(bottomValue).toBe(isMobile ? '20px' : '170px');
    expect(positionValue).toBe('fixed');
    // Verify z-index is using the high-value variable from globals.css
    // Browser might report rounded values for high numbers or resolved vars
    const z = parseInt(zIndexValue, 10);
    expect(z).toBeGreaterThanOrEqual(1000000);
  });

  test('chat window expansion should apply correct styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Inject mock widget with maximize logic
    await page.evaluate(() => {
      // Clear existing
      document.querySelectorAll('.ais-Chat-window').forEach((e) => e.remove());

      const win = document.createElement('div');
      win.className = 'ais-Chat-window';
      win.style.display = 'block';

      // Header with Maximize button
      const header = document.createElement('div');
      header.className = 'ais-ChatHeader';
      const maxBtn = document.createElement('button');
      maxBtn.className = 'ais-ChatHeader-maximizeButton';
      maxBtn.innerText = 'Maximize';
      header.appendChild(maxBtn);
      win.appendChild(header);

      document.body.appendChild(win);

      // Click handler to toggle class (mimic library behavior)
      maxBtn.onclick = () => {
        win.classList.add('maximized');
      };
    });

    const chatWindow = page.locator('.ais-Chat-window');
    const expandBtn = chatWindow.locator('.ais-ChatHeader-maximizeButton');

    // Verify default state first
    await expect(chatWindow).toBeVisible();

    // Click expand
    await expandBtn.click();

    // Verify expanded state
    await expect(chatWindow).toHaveClass(/maximized/);

    const zIndexMax = await chatWindow.evaluate((el) => window.getComputedStyle(el).zIndex);
    const widthMax = await chatWindow.evaluate((el) => window.getComputedStyle(el).width);
    const heightMax = await chatWindow.evaluate((el) => window.getComputedStyle(el).height);
    const positionMax = await chatWindow.evaluate((el) => window.getComputedStyle(el).position);

    // Expect z-index >= 1000000 (override search widget)
    expect(parseInt(zIndexMax, 10)).toBeGreaterThanOrEqual(1000000);

    // Expect full screen dimensions
    const viewport = page.viewportSize();
    if (viewport) {
      expect(parseFloat(widthMax)).toBeCloseTo(viewport.width, 0);
      expect(parseFloat(heightMax)).toBeCloseTo(viewport.height, 0);
    }

    // Expect position fixed (crucial for z-index to work)
    expect(positionMax).toBe('fixed');
  });
});

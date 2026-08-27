import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Desktop Safari, not just the phone one. Blink and WebKit disagree at
    // desktop widths — two columns, a hover state, a focus ring — and none of
    // that is reachable from an iPhone viewport. CI already installs webkit for
    // Mobile Safari, so this project costs runtime and no download.
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      // The theme is CSS custom properties and an attribute, neither of which
      // varies by engine, so one engine answers for all of them. WebKit is the
      // one that cannot answer anyway: it reports oklch as lab(), which axe
      // misreads, so its contrast results would be wrong rather than redundant.
      testIgnore: /theme\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'PORT=3002 npm run start:standalone',
    url: 'http://localhost:3002',
    reuseExistingServer: false,
    timeout: 120000,
  },
});

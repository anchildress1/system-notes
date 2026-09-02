import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/mobile.spec.ts', '**/cross-browser.spec.ts'],
    },
    // Desktop Safari, not just the phone one. Blink and WebKit disagree at
    // desktop widths — two columns, a hover state, a focus ring — and none of
    // that is reachable from an iPhone viewport. CI already installs webkit for
    // Mobile Safari, so this project costs runtime and no download.
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/cross-browser.spec.ts',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/cross-browser.spec.ts',
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile.spec.ts',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: '**/mobile.spec.ts',
    },
  ],
  webServer: {
    command: 'PORT=3002 npm run start:standalone',
    url: 'http://localhost:3002',
    reuseExistingServer: false,
    timeout: 120000,
  },
});

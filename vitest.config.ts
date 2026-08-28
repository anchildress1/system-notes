import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    allowOnly: false,
    setupFiles: ['./tests/setupTests.ts'],
    // tests/unit holds Vitest specs; tests/e2e holds Playwright specs, which run
    // separately. Playwright's default testMatch also matches *.test.ts, so the two
    // trees must stay in sibling directories rather than one nested inside the other.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.json',
        '**/*.test.*',
        'test-env.ts',
        'tests/**',
        '**/*.css',
        'src/app/**/page.tsx',
        'src/app/layout.tsx',
      ],
      // Floors track a few points under actual so a regression trips them. Raise
      // them when coverage rises; never lower them to make a run pass.
      thresholds: {
        lines: 95,
        functions: 93,
        branches: 90,
        statements: 94,
      },
    },
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // Unit tests live in src/; tests/ holds Playwright E2E specs (run separately).
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/setupTests.ts',
        '**/*.css',
        '**/app/**',
        'src/components/AIChat/AIChat.tsx',
        'src/components/GlitterBomb/GlitterBomb.tsx',
        'src/components/SearchPage/SearchPage.tsx',
        'src/components/icons/index.ts',
        'src/hooks/useSparkles.ts',
      ],
      // Floors track a few points under actual so a regression trips them. Raise
      // them when coverage rises; never lower them to make a run pass.
      thresholds: {
        lines: 95,
        functions: 92,
        branches: 85,
        statements: 92,
      },
    },
  },
});

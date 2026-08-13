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
      // Floors sit a few points under what the suite actually reports (98.2 lines,
      // 95.5 functions, 95.2 statements, 89.4 branches) so a real regression trips
      // them while ordinary churn does not. The previous 85/80 left roughly ten
      // points of slack — enough to delete a tenth of the tests and stay green.
      thresholds: {
        lines: 95,
        functions: 92,
        branches: 85,
        statements: 92,
      },
    },
  },
});

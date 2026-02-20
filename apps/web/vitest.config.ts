import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
        'src/lib/recommendations.ts',
        'src/context/ChatContext.tsx',
        'src/hooks/useSparkles.ts',
        'src/utils/userToken.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});

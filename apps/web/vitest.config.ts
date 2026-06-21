import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // apps/web pins react 19.2.4 while the root hoists 19.2.7, so a faithful
    // install leaves two copies on disk and jsdom throws "Invalid hook call
    // (multiple copies of React)". Pin every react/react-dom import to the root
    // copy so tests run against a single instance.
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
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

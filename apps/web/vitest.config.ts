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
        'src/components/ProjectModal/ProjectModal.tsx',
        'src/context/ChatContext.tsx',
        'src/hooks/useSparkles.ts',
        'src/utils/userToken.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    env: {
      NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'test-app-id',
      NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'test-api-key',
      NEXT_PUBLIC_ALGOLIA_AGENT_ID: 'test-agent-id',
    },
  },
});

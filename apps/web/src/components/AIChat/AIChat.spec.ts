import { describe, it, expect, vi } from 'vitest';
import { API_URL } from '@/config';

// Mock process.env
const originalEnv = process.env;

describe('AIChat Configuration', () => {
  it('should use the configured API URL', () => {
    // This smoke test strictly verifies that our config file
    // is correctly exporting a URL string and not undefined
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');

    // Check default fallback if env is missing
    if (!process.env.NEXT_PUBLIC_API_URL) {
      expect(API_URL).toBe('http://localhost:8000');
    }
  });
});

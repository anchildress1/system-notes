/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock CSS
vi.mock('./SearchPage.module.css', () => ({
  default: {
    container: 'container',
    errorState: 'errorState',
    errorMessage: 'errorMessage',
  },
}));

describe('SearchPage Component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders error state when configuration is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', '');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders SearchWithAskAI when configuration is present', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID', 'test-ai-id');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('search-container')).toBeInTheDocument();
  });
});

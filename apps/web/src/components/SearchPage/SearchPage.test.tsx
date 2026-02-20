/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    has: vi.fn(),
  })),
  usePathname: vi.fn(() => '/search'),
}));

vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    search: vi.fn(() =>
      Promise.resolve({
        results: [
          {
            hits: [],
            nbHits: 0,
            page: 0,
            nbPages: 0,
            hitsPerPage: 20,
            processingTimeMS: 1,
            exhaustiveNbHits: true,
            query: '',
            params: '',
            index: 'test_index',
          },
        ],
      })
    ),
    addAlgoliaAgent: vi.fn(),
  })),
}));

vi.mock('./SearchPage.module.css', () => ({
  default: {
    container: 'container',
    errorState: 'errorState',
    errorMessage: 'errorMessage',
    searchSection: 'searchSection',
    searchBoxRoot: 'searchBoxRoot',
    searchBoxForm: 'searchBoxForm',
    searchBoxInput: 'searchBoxInput',
    searchBoxSubmit: 'searchBoxSubmit',
    searchBoxReset: 'searchBoxReset',
    searchBoxSubmitIcon: 'searchBoxSubmitIcon',
    searchBoxResetIcon: 'searchBoxResetIcon',
    metaRow: 'metaRow',
    statsRoot: 'statsRoot',
    algoliaAttribution: 'algoliaAttribution',
    algoliaIcon: 'algoliaIcon',
    algoliaText: 'algoliaText',
    layout: 'layout',
    sidebar: 'sidebar',
    filterSection: 'filterSection',
    refinementGroup: 'refinementGroup',
    refinementTitle: 'refinementTitle',
    refinementRoot: 'refinementRoot',
    refinementList: 'refinementList',
    refinementItem: 'refinementItem',
    refinementItemSelected: 'refinementItemSelected',
    refinementLabel: 'refinementLabel',
    refinementCheckbox: 'refinementCheckbox',
    refinementLabelText: 'refinementLabelText',
    refinementCount: 'refinementCount',
    clearRoot: 'clearRoot',
    clearButton: 'clearButton',
    clearButtonDisabled: 'clearButtonDisabled',
    results: 'results',
    hitsRoot: 'hitsRoot',
    hitsList: 'hitsList',
    hitsItem: 'hitsItem',
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

  it('renders search box container when configuration is present', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'ABCDEF1234');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '12345678901234567890abcdef123456');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('sitesearch')).toBeInTheDocument();
  });

  it('renders error state when app ID is invalid format', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'bad_id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '12345678901234567890abcdef123456');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders error state when API key is too short', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'ABCDEF1234');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'short');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });
});

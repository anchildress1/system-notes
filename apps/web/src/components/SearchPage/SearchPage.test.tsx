/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('./SearchPage.module.css', () => ({
  default: {
    container: 'container',
    errorState: 'errorState',
    errorMessage: 'errorMessage',
    siteSearchWidget: 'siteSearchWidget',
    searchBoxRoot: 'searchBoxRoot',
    searchBoxForm: 'searchBoxForm',
    searchBoxInput: 'searchBoxInput',
    searchBoxSubmit: 'searchBoxSubmit',
    searchBoxReset: 'searchBoxReset',
    searchBoxIcon: 'searchBoxIcon',
    searchHeader: 'searchHeader',
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

  it('renders SiteSearch container when configuration is present', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID', 'test-ai-id');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('search-container')).toBeInTheDocument();
  });
});

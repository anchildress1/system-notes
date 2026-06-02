/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

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
    toString: vi.fn(() => ''),
  })),
  usePathname: vi.fn(() => '/'),
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
            hitsPerPage: 24,
            processingTimeMS: 1,
            exhaustiveNbHits: true,
            query: '',
            params: '',
            index: 'test_index',
            facets: {},
          },
        ],
      })
    ),
    addAlgoliaAgent: vi.fn(),
  })),
}));

vi.mock('./SearchPage.module.css', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

describe('SearchPage Component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function renderSearchPage() {
    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);
  }

  it('renders error state when configuration is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', '');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '');

    await renderSearchPage();

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders the retrieve search box when configuration is present', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'ABCDEF1234');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '12345678901234567890abcdef123456');

    await renderSearchPage();

    expect(screen.getByLabelText('Search the index')).toBeInTheDocument();
  });

  it('focuses retrieve on Cmd/Ctrl+K but leaves browser find alone', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'ABCDEF1234');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '12345678901234567890abcdef123456');

    await renderSearchPage();

    const input = screen.getByLabelText('Search the index');
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: 'f', metaKey: true });
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(input).toHaveFocus();
  });

  it('renders error state when app ID is invalid format', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'bad_id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '12345678901234567890abcdef123456');

    await renderSearchPage();

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders error state when API key is too short', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'ABCDEF1234');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'short');

    await renderSearchPage();

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });
});

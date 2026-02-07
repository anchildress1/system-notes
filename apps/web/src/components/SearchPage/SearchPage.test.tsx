/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
  })),
}));

vi.mock('search-insights', () => ({
  default: vi.fn(),
}));

vi.mock('react-instantsearch', () => ({
  InstantSearch: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="instant-search">{children}</div>
  ),
  SearchBox: () => <input data-testid="search-box" placeholder="Search facts..." />,
  EXPERIMENTAL_Autocomplete: () => <input data-testid="search-box" placeholder="Search facts..." />,
  Hits: () => <div data-testid="hits">Hits component</div>,
  RefinementList: ({ attribute }: { attribute: string }) => (
    <div data-testid={`refinement-${attribute}`}>Refinement for {attribute}</div>
  ),
  ClearRefinements: () => <button data-testid="clear-refinements">Clear Filters</button>,
  Configure: () => null,
  useRefinementList: () => ({ items: [], refine: vi.fn() }),
  useInfiniteHits: () => ({ hits: [], isLastPage: true, showMore: vi.fn() }),
  useInstantSearch: () => ({ status: 'idle' }),
  Stats: () => <div data-testid="stats">100 results</div>,
  Highlight: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('./UnifiedHitCard', () => ({
  default: () => <div data-testid="mock-unified-hit-card" />,
}));

vi.mock('./InfiniteHits', () => ({
  default: () => <div data-testid="hits">Infinite Hits mocked</div>,
}));

// Mock SiAlgolia icon to avoid issues with react-icons in tests if needed
vi.mock('react-icons/si', () => ({
  SiAlgolia: () => <span data-testid="algolia-icon">Algolia Icon</span>,
}));

vi.mock('./GroupedTagFilter', () => ({
  default: ({ attributes }: { attributes: string[] }) => (
    <div data-testid={`refinement-${attributes[0]}`}>Grouped Tag Filter</div>
  ),
}));

describe('SearchPage Component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders error state when Algolia credentials are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', '');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', '');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders InstantSearch when credentials are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('instant-search')).toBeInTheDocument();
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
  });

  it('renders all filter refinement lists', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('refinement-category')).toBeInTheDocument();
    expect(screen.getByTestId('refinement-projects')).toBeInTheDocument();
    expect(screen.getByTestId('refinement-tags.lvl0')).toBeInTheDocument();
  });

  it('renders clear refinements button', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('clear-refinements')).toBeInTheDocument();
  });

  it('renders filter section headings', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Builds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tags' })).toBeInTheDocument();
  });

  it('renders Algolia attribution link', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'test-app-id');
    vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'test-search-key');

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    const algoliaLink = screen.getByRole('link', { name: /Powered by Algolia/i });
    expect(algoliaLink).toHaveAttribute('href', 'https://www.algolia.com');
  });
});

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
  })),
}));

vi.mock('react-instantsearch', () => ({
  InstantSearch: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="instant-search">{children}</div>
  ),
  SearchBox: () => <input data-testid="search-box" placeholder="Search facts..." />,
  Hits: () => <div data-testid="hits">Hits component</div>,
  RefinementList: ({ attribute }: { attribute: string }) => (
    <div data-testid={`refinement-${attribute}`}>Refinement for {attribute}</div>
  ),
  Pagination: () => <nav data-testid="pagination">Pagination</nav>,
  Stats: () => <div data-testid="stats">Stats</div>,
  ClearRefinements: () => <button data-testid="clear-refinements">Clear Filters</button>,
  Configure: () => null,
}));

const originalEnv = { ...process.env };

describe('SearchPage Component', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renders error state when Algolia credentials are missing', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = '';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = '';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText(/Search is currently unavailable/)).toBeInTheDocument();
  });

  it('renders InstantSearch when credentials are present', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('instant-search')).toBeInTheDocument();
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
  });

  it('renders all filter refinement lists', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('refinement-category')).toBeInTheDocument();
    expect(screen.getByTestId('refinement-projects')).toBeInTheDocument();
    expect(screen.getByTestId('refinement-tags.lvl0')).toBeInTheDocument();
  });

  it('renders pagination and stats components', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toBeInTheDocument();
  });

  it('renders clear refinements button', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByTestId('clear-refinements')).toBeInTheDocument();
  });

  it('has correct heading structure for filters', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Filter' })).toBeInTheDocument();
  });

  it('renders filter section headings', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('renders Algolia attribution link', async () => {
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = 'test-app-id';
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key';

    const { default: SearchPage } = await import('./SearchPage');
    render(<SearchPage />);

    const algoliaLink = screen.getByRole('link', { name: /Search powered by Algolia/i });
    expect(algoliaLink).toHaveAttribute('href', 'https://www.algolia.com');
  });
});

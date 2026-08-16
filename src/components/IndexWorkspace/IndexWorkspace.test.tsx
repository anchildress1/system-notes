import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const searchHarness = vi.hoisted(() => ({
  hits: [] as Array<Record<string, unknown>>,
  facets: {} as Record<string, Record<string, number>>,
  nbPages: 1,
  statusPromise: null as Promise<unknown> | null,
  search: vi.fn(),
  insights: vi.fn(),
}));

vi.mock('search-insights', () => ({ default: searchHarness.insights }));

vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    addAlgoliaAgent: vi.fn(),
    search: (...args: unknown[]) => searchHarness.search(...args),
  })),
}));

vi.mock('@/components/FactCard/FactCard', () => ({
  default: ({ hit }: { hit: { title: string } }) => <article>{hit.title}</article>,
}));

function result() {
  return {
    hits: searchHarness.hits,
    nbHits: searchHarness.hits.length,
    page: 0,
    nbPages: searchHarness.nbPages,
    hitsPerPage: 5,
    processingTimeMS: 1,
    exhaustiveNbHits: true,
    query: '',
    params: '',
    index: 'system-notes',
    facets: searchHarness.facets,
  };
}

async function renderWorkspace(credentials = true) {
  vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', credentials ? 'TESTAPPID1' : '');
  vi.stubEnv(
    'NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY',
    credentials ? 'test_search_key_valid_length_20' : ''
  );
  vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME', 'system-notes');
  const { default: IndexWorkspace } = await import('./IndexWorkspace');
  return render(<IndexWorkspace />);
}

describe('IndexWorkspace', () => {
  beforeEach(() => {
    vi.resetModules();
    searchHarness.hits = [
      {
        objectID: 'card:test:1',
        title: 'Failure is data',
        blurb: 'A short note',
        fact: 'A full note',
        category: 'Principle',
        projects: ['System Notes'],
        'tags.lvl0': ['Testing'],
      },
    ];
    searchHarness.facets = {
      category: { Principle: 1 },
      projects: { 'System Notes': 1 },
      'tags.lvl0': { Testing: 1 },
    };
    searchHarness.nbPages = 2;
    searchHarness.statusPromise = null;
    searchHarness.search.mockReset();
    searchHarness.search.mockImplementation(async () => ({ results: [result()] }));
    searchHarness.insights.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    globalThis.history.replaceState({}, '', '/');
  });

  it('renders an honest unavailable state without credentials', async () => {
    await renderWorkspace(false);

    expect(screen.getByRole('heading', { name: 'Search has gone quiet.' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders the approved filing workspace with live counts and pagination', async () => {
    await renderWorkspace();

    expect(await screen.findByRole('searchbox', { name: 'Search the notes index' })).toBeVisible();
    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
    expect(screen.getByText(/1 entry · 1ms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse by type/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('principles')).toBeInTheDocument();
    expect(screen.getByText(/one tile per note/i)).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Powered by.*Algolia/i })).toHaveAttribute(
      'href',
      'https://www.algolia.com'
    );
  });

  it('groups the live taxonomy into the four approved filing families', async () => {
    searchHarness.facets.category = {
      Principles: 12,
      Philosophy: 26,
      'Work Style': 73,
      About: 7,
      Architecture: 16,
      Constraints: 12,
      Decisions: 77,
      Process: 11,
      Experience: 55,
      Experimentation: 31,
      Awards: 27,
    };

    const view = await renderWorkspace();
    await screen.findByText('Failure is data');

    expect(screen.getByRole('button', { name: /principles, 118 notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /architecture, 28 notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decisions, 174 notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /awards ★, 27 notes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /other/i })).not.toBeInTheDocument();
    expect(view.container.querySelector('[data-note-board]')?.children).toHaveLength(347);

    fireEvent.click(screen.getByRole('button', { name: /principles, 118 notes/i }));
    await waitFor(() =>
      expect(view.container.querySelectorAll('[data-note-board] [data-dimmed]')).toHaveLength(229)
    );
  });

  it('updates the query and supports the command-K focus shortcut', async () => {
    await renderWorkspace();
    const input = await screen.findByRole('searchbox', { name: 'Search the notes index' });

    fireEvent.keyDown(window, { key: 'f', metaKey: true });
    expect(input).not.toHaveFocus();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'failure' } });

    await waitFor(() => expect(searchHarness.search.mock.calls.length).toBeGreaterThan(1));
  });

  it('selects and clears a project facet using native controls', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');

    fireEvent.click(screen.getByText('Project'));
    const option = screen.getByRole('checkbox', { name: /System Notes/i });
    fireEvent.click(option);

    await waitFor(() => expect(option).toBeChecked());
    const clear = screen.getByRole('button', { name: 'Clear search and filters' });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    await waitFor(() => expect(option).not.toBeChecked());
    expect(
      screen.queryByRole('button', { name: 'Clear search and filters' })
    ).not.toBeInTheDocument();
  });

  it('collapses the filing rail without removing its category controls', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const toggle = screen.getByRole('button', { name: /Browse by type/i });

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /principles/i })).toBeInTheDocument();
  });

  it('refines from the filing rail and exposes a clear action', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const category = screen.getByRole('button', { name: /principles/i });
    fireEvent.click(category);

    await waitFor(() => expect(category).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('button', { name: 'Clear search and filters' })).toBeEnabled();
  });

  it('promotes a compact queue row into the featured reading slot', async () => {
    searchHarness.hits.push({
      objectID: 'card:test:2',
      title: 'Second decision',
      blurb: 'Another note',
      fact: 'Another full note',
      category: 'Decision',
      projects: ['System Notes'],
      'tags.lvl0': ['Testing'],
    });
    searchHarness.facets.category = { Principle: 1, Decision: 1 };
    await renderWorkspace();
    const featured = await screen.findByRole('article');
    expect(featured).toHaveTextContent('Failure is data');

    fireEvent.click(screen.getByRole('button', { name: /Second decision/i }));

    expect(screen.getByRole('article')).toHaveTextContent('Second decision');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'fresh ranking' } });
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Failure is data'));
  });

  it('selects, clears, and recovers a grouped filing category', async () => {
    searchHarness.facets.category = {
      Principles: 2,
      Philosophy: 3,
      'Work Style': 4,
      About: 5,
    };
    globalThis.history.replaceState({}, '', '/?kind=Principles');

    await renderWorkspace();
    await screen.findByText('Failure is data');
    const principles = screen.getByRole('button', { name: /principles, 14 notes/i });

    expect(principles).toHaveAttribute('aria-pressed', 'mixed');
    fireEvent.click(principles);
    await waitFor(() => expect(principles).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.click(principles);
    await waitFor(() => expect(principles).toHaveAttribute('aria-pressed', 'false'));
  });

  it('files unknown future categories under other without losing refinement', async () => {
    searchHarness.facets.category = { Mystery: 3 };

    const view = await renderWorkspace();
    await screen.findByText('Failure is data');
    const other = screen.getByRole('button', { name: /other, 3 notes/i });

    expect(view.container.querySelector('[data-note-board]')?.children).toHaveLength(3);
    fireEvent.click(other);
    await waitFor(() => expect(other).toHaveAttribute('aria-pressed', 'true'));
  });

  it('renders a direct no-results state without fictional suggestions', async () => {
    searchHarness.hits = [];
    searchHarness.facets = {};
    searchHarness.nbPages = 0;
    await renderWorkspace();

    expect(
      await screen.findByRole('heading', { name: 'No notes match that.' })
    ).toBeInTheDocument();
    expect(screen.getByText(/literal, not psychic/i)).toBeInTheDocument();
    expect(screen.queryByText('principles')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Clear search and filters' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('reports a search failure instead of leaving an empty result region', async () => {
    searchHarness.hits = [];
    searchHarness.facets = {};
    searchHarness.nbPages = 0;
    searchHarness.search.mockRejectedValue(new Error('Algolia unavailable'));

    await renderWorkspace();

    expect(await screen.findByRole('alert')).toHaveTextContent('Search is offline.');
    expect(screen.getByRole('alert')).toHaveTextContent('Everything else works.');
  });

  it('stops waiting when a search request never settles', async () => {
    searchHarness.search
      .mockResolvedValueOnce({ results: [result()] })
      .mockReturnValue(new Promise(() => {}));

    await renderWorkspace();
    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
    vi.useFakeTimers();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'never settles' } });
    await act(async () => Promise.resolve());

    expect(screen.getByRole('status')).toHaveTextContent('Searching…');
    await act(async () => vi.advanceTimersByTimeAsync(5_000));

    expect(screen.getByRole('alert')).toHaveTextContent('Showing the last available results.');
  });

  it('keeps prior results visible when a later search fails', async () => {
    searchHarness.search
      .mockResolvedValueOnce({ results: [result()] })
      .mockRejectedValue(new Error('Algolia unavailable'));
    await renderWorkspace();
    expect(await screen.findByText('Failure is data')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new query' } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Showing the last available results.'
    );
    expect(screen.getByText('Failure is data')).toBeInTheDocument();
  });

  it('withholds unreadable remote hits instead of rendering them', async () => {
    searchHarness.hits = [{ objectID: 'card:test:1', title: 42 }];
    await renderWorkspace();

    expect(
      await screen.findByRole('heading', { name: 'The index returned unreadable notes.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('withheld instead of crashing');
  });

  it('warns when only part of a mixed remote response is readable', async () => {
    searchHarness.hits.push({ objectID: '../escape', title: 'Broken' });
    await renderWorkspace();

    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Some malformed notes were withheld.');
    expect(screen.queryByText('Broken')).not.toBeInTheDocument();
  });

  it('strips malformed Algolia highlight metadata before InstantSearch processes it', async () => {
    searchHarness.hits[0]!['_highlightResult'] = { title: { value: 42 } };

    await renderWorkspace();

    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
  });

  it('moves between pagination pages and disables the first-page back control', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const pagination = screen.getByRole('navigation', { name: 'Notes pagination' });

    expect(within(pagination).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    fireEvent.click(within(pagination).getByRole('button', { name: 'Next page' }));

    await waitFor(() =>
      expect(within(pagination).getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page'
      )
    );
    expect(within(pagination).getByRole('button', { name: 'Next page' })).toBeDisabled();

    fireEvent.click(within(pagination).getByRole('button', { name: 'Previous page' }));
    await waitFor(() =>
      expect(within(pagination).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page'
      )
    );
  });
});

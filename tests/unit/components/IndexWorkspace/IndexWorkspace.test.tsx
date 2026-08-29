import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOARD_MAX_ROWS } from '@/components/IndexWorkspace/boardLayout';

const searchHarness = vi.hoisted(() => ({
  hits: [] as Array<Record<string, unknown>>,
  facets: {} as Record<string, Record<string, number>>,
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
  default: ({ hit, position }: { hit: { title: string }; position: number }) => (
    <article data-position={position}>{hit.title}</article>
  ),
}));

function result() {
  return {
    hits: searchHarness.hits.slice(0, 500),
    nbHits: searchHarness.hits.length,
    page: 0,
    nbPages: Math.ceil(searchHarness.hits.length / 500),
    hitsPerPage: 500,
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
  const { default: IndexWorkspace } = await import('@/components/IndexWorkspace/IndexWorkspace');
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

  it('keeps focus in the pager when an end control retires', async () => {
    // Reaching the last page disables the control that got you there. A disabled
    // element cannot hold focus, so the browser drops it to <body> and a keyboard
    // reader is thrown back to the top of the document mid-task.
    searchHarness.hits = Array.from({ length: 7 }, (_, index) => ({
      objectID: `card:test:${index + 1}`,
      title: `Ranked note ${index + 1}`,
      fact: `Evidence ${index + 1}`,
      category: 'Decisions',
      projects: ['System Notes'],
      'tags.lvl0': ['Testing'],
      __position: index + 1,
    }));

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    const pager = screen.getByRole('navigation', { name: 'Alternate notes pages' });
    const next = within(pager).getByRole('button', { name: /next/i });
    const previous = within(pager).getByRole('button', { name: /previous/i });
    expect(previous).toBeDisabled();

    next.focus();
    fireEvent.click(next);

    await waitFor(() => expect(next).toBeDisabled());
    expect(document.body).not.toHaveFocus();
    expect(previous).toHaveFocus();

    fireEvent.click(previous);

    await waitFor(() => expect(previous).toBeDisabled());
    expect(next).toHaveFocus();
  });

  it('renders the approved filing workspace with a capped ranked board', async () => {
    await renderWorkspace();

    expect(await screen.findByRole('searchbox', { name: 'Search the notes index' })).toBeVisible();
    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
    expect(screen.getByText(/1 entry · 1ms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filed under/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Principle')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Failure is data, position 1/i })).toBeVisible();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Notes pagination' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Powered by.*Algolia/i })).toHaveAttribute(
      'href',
      'https://www.algolia.com'
    );
  });

  it('drops an empty category and keeps a refined one without a count', async () => {
    // Narrowing far enough leaves categories the result set cannot contain.
    // Algolia reports them at zero; one still refined has to survive, because
    // it is the control that lifts the refinement emptying the page.
    searchHarness.facets.category = { Decisions: 4, Principles: 0, Retired: 0 };
    searchHarness.hits[0]!.category = 'Decisions';
    globalThis.history.replaceState({}, '', '/notes?kind=Principles');

    await renderWorkspace();
    await screen.findByText('Failure is data');

    expect(screen.getByRole('button', { name: /^Decisions, 4 notes$/i })).toBeInTheDocument();
    // Zero and unrefined: it can filter nothing, so it is not offered.
    expect(screen.queryByRole('button', { name: /^Retired,/i })).not.toBeInTheDocument();

    const refined = screen.getByRole('button', { name: /^Principles, no matching notes$/i });
    expect(refined).toBeInTheDocument();
    // The sign lifts it; a bare "0" standing where a filter's size belongs does not.
    expect(refined).not.toHaveTextContent('0');
    expect(refined).toHaveTextContent('−');
  });

  it('shows every category the index returns as its own filter', async () => {
    // A migration that changes the taxonomy must surface without a code change,
    // so nothing is folded into a fixed set of families or an "other" bucket.
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

    // Board tiles also carry data-category, so count the filter controls.
    expect(screen.getAllByRole('button', { name: /, [\d,]+ notes$/i })).toHaveLength(11);
    for (const [label, count] of [
      ['Principles', 12],
      ['Philosophy', 26],
      ['Work Style', 73],
      ['About', 7],
      ['Architecture', 16],
      ['Constraints', 12],
      ['Decisions', 77],
      ['Process', 11],
      ['Experience', 55],
      ['Experimentation', 31],
    ] as const) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}, ${count} notes$`, 'i') })
      ).toBeInTheDocument();
    }
    // Awards keep their star, so the label is not a bare facet value.
    expect(screen.getByRole('button', { name: /^Awards ★, 27 notes$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^other,/i })).not.toBeInTheDocument();

    // The tile carries the note's own category, not a family it was folded into.
    expect(view.container.querySelector('[data-note-board] [role="option"]')).toHaveAttribute(
      'data-category',
      'Principle'
    );

    const principles = screen.getByRole('button', { name: /principles, 12 notes/i });
    fireEvent.click(principles);
    await waitFor(() => expect(principles).toHaveAttribute('aria-pressed', 'true'));
  });

  it('maps the original 347 ranked hits to one keyboard-operable board', async () => {
    const categories = ['Award', 'Decision', 'Architecture', 'Principle'] as const;
    searchHarness.hits = Array.from({ length: 347 }, (_, index) => ({
      objectID: `card:test:${index + 1}`,
      title: `Ranked note ${index + 1}`,
      blurb: `Summary ${index + 1}`,
      fact: `Evidence ${index + 1}`,
      category: categories[index % categories.length],
      projects: ['System Notes'],
      'tags.lvl0': ['Testing'],
      __position: index + 1,
    }));
    searchHarness.facets.category = {
      Award: 27,
      Decision: 26,
      Architecture: 26,
      Principle: 26,
    };

    await renderWorkspace();
    expect(await screen.findByRole('article')).toHaveTextContent('Ranked note 1');
    const boardElement = screen.getByRole('listbox', { name: 'Top ranked notes' });
    const board = within(boardElement);
    const tiles = board.getAllByRole('option');

    expect(tiles).toHaveLength(347);
    // Tiles carry the note's own category, exactly as the index reported it.
    expect(tiles.slice(0, 4).map((tile) => tile.dataset.category)).toEqual([
      'Award',
      'Decision',
      'Architecture',
      'Principle',
    ]);
    expect(tiles[346]).toHaveAccessibleName('Ranked note 347, position 347');
    expect(screen.queryByText(/malformed notes were withheld/i)).not.toBeInTheDocument();
    expect(
      [...document.querySelectorAll('[data-ranked-queue] button')].map((row) =>
        row.textContent?.trim()
      )
    ).toEqual([2, 3, 4, 5, 6].map((rank) => expect.stringContaining(`Ranked note ${rank}`)));
    expect(boardElement).toHaveAttribute('tabindex', '0');
    expect(tiles.every((tile) => !tile.hasAttribute('tabindex'))).toBe(true);
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    boardElement.focus();

    fireEvent.keyDown(boardElement, { key: 'ArrowRight' });
    expect(boardElement).toHaveFocus();
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    expect(board.getByRole('option', { name: 'Ranked note 2, position 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(boardElement, { key: 'Home' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    fireEvent.keyDown(boardElement, { key: 'ArrowLeft' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    fireEvent.keyDown(boardElement, { key: 'ArrowDown' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    fireEvent.keyDown(boardElement, { key: 'ArrowUp' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    fireEvent.keyDown(boardElement, { key: 'End' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-346');
    fireEvent.keyDown(boardElement, { key: 'ArrowUp' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-345');
    fireEvent.keyDown(boardElement, { key: 'a' });
    expect(boardElement).toHaveAttribute('aria-activedescendant', 'note-board-option-345');

    fireEvent.click(board.getByRole('option', { name: 'Ranked note 37, position 37' }));

    expect(screen.getByRole('article')).toHaveTextContent('Ranked note 37');
    expect(screen.getByRole('article')).toHaveAttribute('data-position', '37');
    expect(boardElement).toHaveFocus();
    expect(board.getByRole('option', { name: 'Ranked note 37, position 37' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      [...document.querySelectorAll('[data-ranked-queue] button')].map((row) =>
        row.textContent?.trim()
      )
    ).toEqual([1, 2, 3, 4, 5].map((rank) => expect.stringContaining(`Ranked note ${rank}`)));
    fireEvent.click(board.getByRole('option', { name: 'Ranked note 3, position 3' }));
    expect(screen.getByRole('article')).toHaveTextContent('Ranked note 3');
    expect(
      [...document.querySelectorAll('[data-ranked-queue] button')].map((row) =>
        row.textContent?.trim()
      )
    ).toEqual([1, 2, 4, 5, 6].map((rank) => expect.stringContaining(`Ranked note ${rank}`)));
  });

  it('moves by title type-ahead, supports rapid prefixes, and wraps', async () => {
    searchHarness.hits = [
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:amber',
        title: 'Amber boundary',
        __position: 1,
      },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:architecture',
        title: 'Architecture boundary',
        __position: 2,
      },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:decision',
        title: 'Decision boundary',
        __position: 3,
      },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:put',
        title: 'I put a database behind it',
        __position: 4,
      },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:put-another',
        title: 'I put another service behind it',
        __position: 5,
      },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:ipip',
        title: 'IPIP items are different',
        __position: 6,
      },
    ];

    await renderWorkspace();
    await screen.findByText('Amber boundary');
    const board = screen.getByRole('listbox', { name: 'Top ranked notes' });
    board.focus();

    fireEvent.keyDown(board, { key: 'a' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    expect(screen.getByRole('article')).toHaveTextContent('Architecture boundary');

    // "am" resolves the other A title and wraps from the second option.
    fireEvent.keyDown(board, { key: 'm' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');
    expect(screen.getByRole('article')).toHaveTextContent('Amber boundary');

    fireEvent.keyDown(board, { key: 'z' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');

    fireEvent.keyDown(board, { key: 'Home' });
    fireEvent.keyDown(board, { key: 'a' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-1');
    fireEvent.keyDown(board, { key: 'a' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-0');

    fireEvent.keyDown(board, { key: 'Home' });
    fireEvent.keyDown(board, { key: 'i' });
    fireEvent.keyDown(board, { key: ' ' });
    fireEvent.keyDown(board, { key: 'p' });
    expect(board).toHaveAttribute('aria-activedescendant', 'note-board-option-3');
    expect(screen.getByRole('article')).toHaveTextContent('I put a database behind it');
  });

  it('caps the board at 500 notes without expanding the reading pane', async () => {
    searchHarness.hits = Array.from({ length: 501 }, (_, index) => ({
      objectID: `card:test:${index + 1}`,
      title: `Ranked note ${index + 1}`,
      blurb: `Summary ${index + 1}`,
      fact: `Evidence ${index + 1}`,
      category: 'Decision',
      projects: ['System Notes'],
      'tags.lvl0': ['Testing'],
      __position: index + 1,
    }));

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    const board = within(screen.getByRole('listbox', { name: 'Top ranked notes' }));
    expect(board.getAllByRole('option')).toHaveLength(500);
    expect(board.getByRole('option', { name: 'Ranked note 500, position 500' })).toBeVisible();
    expect(
      board.queryByRole('option', { name: /Ranked note 501, position/i })
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-ranked-queue] button')).toHaveLength(5);
  });

  it.each([1, 2, 3, 4])(
    'shows every unique note when only %i ranked notes are available',
    async (count) => {
      searchHarness.hits = Array.from({ length: count }, (_, index) => ({
        objectID: `card:test:${index + 1}`,
        title: `Ranked note ${index + 1}`,
        blurb: `Summary ${index + 1}`,
        fact: `Evidence ${index + 1}`,
        category: 'Decision',
        projects: ['System Notes'],
        'tags.lvl0': ['Testing'],
        __position: index + 1,
      }));

      await renderWorkspace();

      expect(await screen.findByRole('article')).toHaveTextContent('Ranked note 1');
      const rows = [...document.querySelectorAll('[data-ranked-queue] button')];
      expect(rows).toHaveLength(Math.max(0, count - 1));
      expect(rows.map((row) => row.textContent)).toEqual(
        Array.from({ length: count - 1 }, (_, index) =>
          expect.stringContaining(`Ranked note ${index + 2}`)
        )
      );
      // The queue states its count by what it renders, not by a line of prose
      // restating it above the cards.
      expect(screen.queryByText(/notes in view/i)).not.toBeInTheDocument();
    }
  );

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
    expect(clear).toHaveClass('marked-hover');
    fireEvent.click(clear);
    await waitFor(() => expect(option).not.toBeChecked());
    expect(
      screen.queryByRole('button', { name: 'Clear search and filters' })
    ).not.toBeInTheDocument();
  });

  it('closes an open filter when the pointer lands outside it', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const details = screen.getByText('Project').closest('details') as HTMLDetailsElement;

    fireEvent.click(screen.getByText('Project'));
    await waitFor(() => expect(details.open).toBe(true));

    // A pointer INSIDE the panel must not close it, or every checkbox click
    // would dismiss the menu it was aimed at.
    fireEvent.pointerDown(screen.getByRole('checkbox', { name: /System Notes/i }));
    expect(details.open).toBe(true);

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(details.open).toBe(false));
  });

  it('closes an open filter on Escape and returns focus to its summary', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const summary = screen.getByText('Project');
    const details = summary.closest('details') as HTMLDetailsElement;

    fireEvent.click(summary);
    await waitFor(() => expect(details.open).toBe(true));

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(details.open).toBe(false));
    expect(summary).toHaveFocus();
  });

  it('leaves a closed filter alone when the pointer lands outside it', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const details = screen.getByText('Project').closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);

    // Nothing is bound while the panel is shut, so this must be inert rather
    // than throwing or reopening anything.
    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(details.open).toBe(false);
  });

  it('collapses the filing rail without removing its category controls', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const toggle = screen.getByRole('button', { name: /Filed under/i });

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /principle/i })).toBeInTheDocument();
  });

  it('refines from the filing rail and exposes a clear action', async () => {
    await renderWorkspace();
    await screen.findByText('Failure is data');
    const category = screen.getByRole('button', { name: /principle/i });
    fireEvent.click(category);

    await waitFor(() => expect(category).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('button', { name: 'Clear search and filters' })).toBeEnabled();
  });

  it('reads a compact queue row without changing the ranked order', async () => {
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
    const view = await renderWorkspace();
    const featured = await screen.findByRole('article');
    expect(featured).toHaveTextContent('Failure is data');

    fireEvent.click(view.container.querySelector('[data-ranked-queue] button')!);

    expect(screen.getByRole('article')).toHaveTextContent('Second decision');
    await waitFor(() =>
      expect(screen.getByLabelText('Now reading: Second decision')).toHaveFocus()
    );
    expect(
      [...view.container.querySelectorAll('[data-ranked-queue] button')].map((row) =>
        row.textContent?.trim()
      )
    ).toEqual([expect.stringContaining('Failure is data')]);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'fresh ranking' } });
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Failure is data'));
  });

  it('toggles one category without disturbing its neighbours', async () => {
    searchHarness.facets.category = {
      Principles: 2,
      Philosophy: 3,
      'Work Style': 4,
      About: 5,
    };
    globalThis.history.replaceState({}, '', '/?kind=Principles');

    await renderWorkspace();
    await screen.findByText('Failure is data');
    const principles = screen.getByRole('button', { name: /principles, 2 notes/i });
    const philosophy = screen.getByRole('button', { name: /philosophy, 3 notes/i });

    // Each value refines on its own, so there is no partially-selected family
    // and no "mixed" state to reason about.
    await waitFor(() => expect(principles).toHaveAttribute('aria-pressed', 'true'));
    expect(philosophy).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(principles);
    await waitFor(() => expect(principles).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(philosophy);
    await waitFor(() => expect(philosophy).toHaveAttribute('aria-pressed', 'true'));
    expect(principles).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps each category on its own swatch when a filter reorders the facets', async () => {
    searchHarness.facets.category = { Alpha: 30, Beta: 20, Gamma: 10 };

    const view = await renderWorkspace();
    await screen.findByText('Failure is data');
    const swatchOf = (name: RegExp) =>
      screen.getByRole('button', { name }).querySelector('span')?.getAttribute('style');

    const before = {
      alpha: swatchOf(/alpha, 30 notes/i),
      beta: swatchOf(/beta, 20 notes/i),
      gamma: swatchOf(/gamma, 10 notes/i),
    };
    expect(before.alpha).toBeTruthy();
    expect(new Set(Object.values(before)).size).toBe(3);

    // Narrowing re-sorts the facet list by the reduced counts. Reading a
    // category's tone from that order repainted most of the board on every
    // refinement, so the census could not be compared against itself.
    searchHarness.facets.category = { Gamma: 9, Alpha: 3, Beta: 1 };
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'narrowed' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /gamma, 9 notes/i })).toBeInTheDocument()
    );

    expect(swatchOf(/alpha, 3 notes/i)).toBe(before.alpha);
    expect(swatchOf(/beta, 1 note/i)).toBe(before.beta);
    expect(swatchOf(/gamma, 9 notes/i)).toBe(before.gamma);
    expect(view.container.querySelector('[data-note-board]')).toBeInTheDocument();
  });

  it('surfaces a category it has never seen instead of hiding it', async () => {
    searchHarness.facets.category = { Mystery: 3 };
    searchHarness.hits[0]!.category = 'Mystery';

    const view = await renderWorkspace();
    await screen.findByText('Failure is data');
    const mystery = screen.getByRole('button', { name: /mystery, 3 notes/i });

    // An unrecognized category is a real filter, not an "other" bucket. Its
    // board tile falls back to the default swatch rather than disappearing.
    expect(view.container.querySelector('[data-note-board]')?.children).toHaveLength(1);
    expect(view.container.querySelector('[data-note-board] [role="option"]')).toHaveAttribute(
      'data-category',
      'Mystery'
    );
    fireEvent.click(mystery);
    await waitFor(() => expect(mystery).toHaveAttribute('aria-pressed', 'true'));
  });

  it('renders a direct no-results state without fictional suggestions', async () => {
    searchHarness.hits = [];
    searchHarness.facets = {};
    await renderWorkspace();

    expect(
      await screen.findByRole('heading', { name: 'No notes match that.' })
    ).toBeInTheDocument();
    expect(screen.getByText(/literal, not psychic/i)).toBeInTheDocument();
    expect(screen.queryByText('Principle')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Clear search and filters' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('reports a search failure instead of leaving an empty result region', async () => {
    searchHarness.hits = [];
    searchHarness.facets = {};
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
    searchHarness.hits.push({ objectID: '@/components/IndexWorkspace/escape', title: 'Broken' });
    await renderWorkspace();

    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Some malformed notes were withheld.');
    expect(screen.queryByText('Broken')).not.toBeInTheDocument();
  });

  it('preserves remote ranks when a malformed hit is withheld', async () => {
    searchHarness.hits = [
      { ...searchHarness.hits[0], __position: 1 },
      { objectID: '@/components/IndexWorkspace/escape', title: 'Broken', __position: 2 },
      {
        ...searchHarness.hits[0],
        objectID: 'card:test:3',
        title: 'Actual rank three',
        __position: 3,
      },
    ];

    await renderWorkspace();

    const board = within(await screen.findByRole('listbox', { name: 'Top ranked notes' }));
    expect(board.getByRole('option', { name: 'Failure is data, position 1' })).toBeVisible();
    expect(board.getByRole('option', { name: 'Actual rank three, position 3' })).toBeVisible();
    expect(document.querySelector('[data-ranked-queue] button')).toHaveTextContent(
      '№ 3 · System Notes'
    );
    fireEvent.click(board.getByRole('option', { name: 'Actual rank three, position 3' }));
    expect(screen.getByRole('article')).toHaveAttribute('data-position', '3');
  });

  it('withholds duplicate remote IDs from the board and visible notes', async () => {
    searchHarness.hits = Array.from({ length: 6 }, (_, index) => ({
      ...searchHarness.hits[0],
      objectID: `card:test:${index + 1}`,
      title: `Unique note ${index + 1}`,
      __position: index + 1,
    }));
    searchHarness.hits.splice(2, 0, {
      ...searchHarness.hits[1],
      title: 'Duplicate should disappear',
      __position: 3,
    });

    await renderWorkspace();

    expect(await screen.findByRole('article')).toHaveTextContent('Unique note 1');
    expect(screen.queryByText('Duplicate should disappear')).not.toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: /Unique note \d+, position/i })).toHaveLength(6);
    expect(document.querySelectorAll('[data-ranked-queue] button')).toHaveLength(5);
    expect(screen.getByRole('alert')).toHaveTextContent('Some malformed notes were withheld.');
  });

  it('strips malformed Algolia highlight metadata before InstantSearch processes it', async () => {
    searchHarness.hits[0]!['_highlightResult'] = { title: { value: 42 } };

    await renderWorkspace();

    expect(await screen.findByText('Failure is data')).toBeInTheDocument();
  });
});

describe('board column measurement', () => {
  const COLUMNS = 20;
  // 347 notes over 20 columns needs 18 rows; the board stands BOARD_MAX_ROWS.
  const TRIMMED = BOARD_MAX_ROWS * COLUMNS;

  /**
   * jsdom lays nothing out: every element reports zero client rects and grid
   * tracks never resolve, which is the one state the board treats as
   * "unmeasured". These stubs put it in the state a real browser is in.
   */
  function layOutBoard(gridTemplateColumns: string, laidOut = true) {
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
      (laidOut ? [{ width: 359, height: 152 }] : []) as unknown as DOMRectList
    );
    const computeStyle = globalThis.getComputedStyle.bind(globalThis);
    vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(((
      element: Element,
      pseudoElement?: string | null
    ) => {
      const style = computeStyle(element, pseudoElement ?? undefined);
      if (!(element instanceof HTMLElement) || !element.hasAttribute('data-note-board')) {
        return style;
      }
      return new Proxy(style, {
        get(target, property) {
          if (property === 'gridTemplateColumns') return gridTemplateColumns;
          const value = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    }) as typeof globalThis.getComputedStyle);
  }

  const resolvedTracks = (columns = COLUMNS) =>
    Array.from({ length: columns }, () => '24px').join(' ');

  function installResizeObserver() {
    class StubResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
  }

  function board() {
    return document.querySelector('[data-note-board]');
  }

  beforeEach(() => {
    searchHarness.hits = Array.from({ length: 347 }, (_, index) => ({
      objectID: `card:test:${index + 1}`,
      title: `Ranked note ${index + 1}`,
      blurb: `Summary ${index + 1}`,
      fact: `Evidence ${index + 1}`,
      category: 'Principle',
      projects: ['System Notes'],
      'tags.lvl0': ['Testing'],
      __position: index + 1,
    }));
    searchHarness.facets = {
      category: { Principle: 347 },
      projects: { 'System Notes': 347 },
      'tags.lvl0': { Testing: 347 },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('trims to whole rows when a ResizeObserver is available', async () => {
    installResizeObserver();
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    await waitFor(() => expect(board()?.children).toHaveLength(TRIMMED));
    expect(board()!.children.length % COLUMNS).toBe(0);
  });

  it('trims to whole rows with no ResizeObserver at all', async () => {
    // The observer only reports *later* width changes. Gating the first
    // measurement on it left the board untrimmed, and so ragged in its last
    // row — 13 rows of 20 followed by a row of 19.
    expect(globalThis.ResizeObserver).toBeUndefined();
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    await waitFor(() => expect(board()?.children).toHaveLength(TRIMMED));
    expect(board()!.children.length % COLUMNS).toBe(0);
  });

  it('leaves the board untrimmed while the track list is still unresolved', async () => {
    // The specified value, not resolved pixel tracks. Counting its tokens
    // would yield a fake 3 and drop the board to a third of a row.
    layOutBoard('repeat(auto-fill, 24px)');

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    expect(board()?.children).toHaveLength(347);
  });

  it('leaves the board untrimmed when the element reports no grid at all', async () => {
    layOutBoard('none');

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    expect(board()?.children).toHaveLength(347);
  });

  it('ignores a measurement taken while the board is not laid out', async () => {
    // A display:none subtree reports the specified template rather than
    // resolved tracks, so a hidden board must not re-fit the visible one.
    layOutBoard(resolvedTracks(), false);

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    expect(board()?.children).toHaveLength(347);
  });

  it('counts tracks separated by irregular whitespace', async () => {
    layOutBoard(`  24px   24px \n 24px  `);

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    // Three columns parsed out of that whitespace, times the height cap.
    await waitFor(() => expect(board()?.children).toHaveLength(BOARD_MAX_ROWS * 3));
  });

  it('keeps every note when the board is wider than the index is long', async () => {
    searchHarness.hits = searchHarness.hits.slice(0, 6);
    searchHarness.facets.category = { Principle: 6 };
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    // Six notes cannot fill a 20-column row; a single short row is still a
    // rectangle, and dropping them all would empty the board.
    expect(board()?.children).toHaveLength(6);
  });

  it('says how many of the census it is showing once it trims', async () => {
    installResizeObserver();
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');

    await waitFor(() => expect(board()?.children).toHaveLength(TRIMMED));
  });

  it('keeps aria-activedescendant pointing at a tile that exists after trimming', async () => {
    installResizeObserver();
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');
    await waitFor(() => expect(board()?.children).toHaveLength(TRIMMED));

    const tiles = board() as HTMLElement;
    fireEvent.keyDown(tiles, { key: 'End' });

    await waitFor(() => {
      const active = tiles.getAttribute('aria-activedescendant');
      expect(active).toBe(`note-board-option-${TRIMMED - 1}`);
      // A dangling reference is the failure this guards: the id must resolve.
      expect(document.getElementById(active!)).toBeInTheDocument();
    });
  });

  it('keeps every trimmed tile a labelled option', async () => {
    installResizeObserver();
    layOutBoard(resolvedTracks());

    await renderWorkspace();
    await screen.findByText('Ranked note 1');
    await waitFor(() => expect(board()?.children).toHaveLength(TRIMMED));

    const options = within(board() as HTMLElement).getAllByRole('option');
    expect(options).toHaveLength(TRIMMED);
    for (const option of options) {
      expect(option).toHaveAttribute('aria-label', expect.stringMatching(/, position \d+$/));
      expect(option).toHaveAttribute('aria-selected');
    }
  });
});

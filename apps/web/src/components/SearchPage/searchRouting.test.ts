import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toRouteState, toUiState, getSearchPageURL, createSearchRouting } from './searchRouting';

// Mock the history router from instantsearch.js
const mockHistory = vi.fn();
vi.mock('instantsearch.js/es/lib/routers', () => ({
  history: (config: Record<string, unknown>) => {
    mockHistory(config);
    return { ...config, dispose: vi.fn() };
  },
}));

const indexName = 'system-notes';

describe('searchRouting', () => {
  beforeEach(() => {
    mockHistory.mockClear();
  });

  it('maps uiState (query, page, refinementList kind, project, tag) to route state', () => {
    const uiState = {
      [indexName]: {
        query: 'carbon',
        page: 2,
        refinementList: {
          category: ['Decisions', 'Principle'],
          projects: ['Vestige'],
          'tags.lvl0': ['Engineering', 'Design'],
        },
      },
    };
    expect(toRouteState(uiState, indexName)).toEqual({
      q: 'carbon',
      page: 2,
      kind: ['Decisions', 'Principle'],
      project: ['Vestige'],
      tag: ['Engineering', 'Design'],
    });
  });

  it('omits empty refinement lists', () => {
    const uiState = {
      [indexName]: {
        query: '',
        refinementList: { category: [], projects: [], 'tags.lvl0': [] },
      },
    };
    expect(toRouteState(uiState, indexName)).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
  });

  it('maps route state back to uiState with multi-select refinementList', () => {
    const routeState = {
      q: 'agents',
      page: 3,
      kind: ['Philosophy', 'Decisions'],
      project: ['Vestige'],
      tag: ['Engineering'],
    };
    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        query: 'agents',
        page: 3,
        refinementList: {
          category: ['Philosophy', 'Decisions'],
          projects: ['Vestige'],
          'tags.lvl0': ['Engineering'],
        },
      },
    });
  });

  it('maps route state back to uiState with only kind', () => {
    expect(toUiState({ q: 'a', kind: ['P'] }, indexName)).toEqual({
      [indexName]: { query: 'a', page: undefined, refinementList: { category: ['P'] } },
    });
  });

  it('maps route state back to uiState with only project', () => {
    expect(toUiState({ q: 'a', project: ['V'] }, indexName)).toEqual({
      [indexName]: { query: 'a', page: undefined, refinementList: { projects: ['V'] } },
    });
  });

  it('maps route state back to uiState with only tag', () => {
    expect(toUiState({ q: 'a', tag: ['TypeScript'] }, indexName)).toEqual({
      [indexName]: {
        query: 'a',
        page: undefined,
        refinementList: { 'tags.lvl0': ['TypeScript'] },
      },
    });
  });

  it('omits refinementList when no facet refinements are selected', () => {
    expect(toUiState({ q: 'x', page: 2 }, indexName)).toEqual({
      [indexName]: { query: 'x', page: 2 },
    });
  });

  it('omits refinementList when arrays are present but empty', () => {
    expect(toUiState({ q: 'x', kind: [], project: [], tag: [] }, indexName)).toEqual({
      [indexName]: { query: 'x', page: undefined },
    });
  });

  it('handles uiState without query or refinementList gracefully', () => {
    expect(toRouteState({ [indexName]: {} } as never, indexName)).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
  });

  it('handles a completely empty routeState in toUiState', () => {
    expect(toUiState({}, indexName)).toEqual({
      [indexName]: { query: undefined, page: undefined },
    });
  });

  it('builds a search page URL with multiple facet values appended', () => {
    const indexUiState = {
      query: 'carbon',
      page: 2,
      refinementList: { category: ['Work Style', 'Decisions'] },
    };
    expect(getSearchPageURL(indexUiState, indexName)).toBe(
      '/?q=carbon&page=2&kind=Work+Style&kind=Decisions'
    );
  });

  it('returns base path when there is no state', () => {
    expect(getSearchPageURL({}, indexName)).toBe('/');
  });

  it('respects a custom basePath', () => {
    expect(getSearchPageURL({}, indexName, '/search')).toBe('/search');
  });

  describe('router configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let routerConfig: any;
    const qsModule = {
      stringify: (params: Record<string, unknown>) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (Array.isArray(value)) for (const v of value) search.append(key, String(v));
          else if (value !== undefined) search.append(key, String(value));
        }
        return search.toString();
      },
      parse: (str: string) => {
        const params = new URLSearchParams(str);
        const result: Record<string, string | string[]> = {};
        params.forEach((value, key) => {
          if (result[key]) {
            if (Array.isArray(result[key])) {
              (result[key] as string[]).push(value);
            } else {
              result[key] = [result[key] as string, value];
            }
          } else {
            result[key] = value;
          }
        });
        return result;
      },
    };

    beforeEach(() => {
      createSearchRouting(indexName);
      routerConfig = mockHistory.mock.calls[0][0];
    });

    it('generates the correct window title', () => {
      expect(routerConfig.windowTitle()).toBe("Choices | Ashley's System Notes");
    });

    it('creates a URL with q, page, and multi-value kind', () => {
      const routeState = { q: 'carbon', page: 2, kind: ['Decisions', 'Principle'] };
      const location = { origin: 'https://example.com', pathname: '/', search: '' };
      const mockStringify = vi.fn().mockReturnValue('?mocked');
      const url = routerConfig.createURL({
        qsModule: { ...qsModule, stringify: mockStringify },
        routeState,
        location,
      });
      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'carbon', page: 2, kind: ['Decisions', 'Principle'] }),
        expect.any(Object)
      );
      expect(url).toBe('https://example.com/?mocked');
    });

    it('preserves factId in createURL when present in the current URL', () => {
      const location = {
        origin: 'https://example.com',
        pathname: '/',
        search: '?factId=card%3Atest%3A001',
      };
      const mockStringify = vi.fn().mockReturnValue('');
      routerConfig.createURL({
        qsModule: { ...qsModule, stringify: mockStringify },
        routeState: {},
        location,
      });
      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({ factId: 'card:test:001' }),
        expect.any(Object)
      );
    });

    it('does not inject factId when absent from the current URL', () => {
      const location = { origin: 'https://example.com', pathname: '/', search: '' };
      const mockStringify = vi.fn().mockReturnValue('');
      routerConfig.createURL({
        qsModule: { ...qsModule, stringify: mockStringify },
        routeState: {},
        location,
      });
      expect(mockStringify).toHaveBeenCalledWith(
        expect.not.objectContaining({ factId: expect.anything() }),
        expect.any(Object)
      );
    });

    it('parses a single kind value into a one-element array', () => {
      const location = { search: '?q=carbon&page=2&kind=Decisions' };
      expect(routerConfig.parseURL({ qsModule, location })).toEqual({
        q: 'carbon',
        page: 2,
        kind: ['Decisions'],
        project: undefined,
        tag: undefined,
      });
    });

    it('parses repeated kind params into an array', () => {
      const location = { search: '?kind=A&kind=B&kind=C' };
      expect(routerConfig.parseURL({ qsModule, location }).kind).toEqual(['A', 'B', 'C']);
    });

    it.each(['?page=invalid', '?page=0', '?page=1', '?page=-5'])(
      'ignores invalid/low page value %s',
      (search) => {
        expect(routerConfig.parseURL({ qsModule, location: { search } }).page).toBeUndefined();
      }
    );
  });
});

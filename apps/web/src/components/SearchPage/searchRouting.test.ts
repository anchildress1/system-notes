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

  it('maps uiState (query, page, menu kind) to route state', () => {
    const uiState = {
      [indexName]: { query: 'carbon', page: 2, menu: { category: 'Decisions' } },
    };
    expect(toRouteState(uiState, indexName)).toEqual({ q: 'carbon', page: 2, kind: 'Decisions' });
  });

  it('omits empty query and kind', () => {
    const uiState = { [indexName]: { query: '', menu: { category: '' } } };
    expect(toRouteState(uiState, indexName)).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
    });
  });

  it('maps route state back to uiState with a menu refinement', () => {
    const routeState = { q: 'agents', page: 3, kind: 'Philosophy' };
    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: { query: 'agents', page: 3, menu: { category: 'Philosophy' } },
    });
  });

  it('omits menu when no kind is selected', () => {
    expect(toUiState({ q: 'x', page: 2 }, indexName)).toEqual({
      [indexName]: { query: 'x', page: 2 },
    });
  });

  it('handles uiState without query or menu gracefully', () => {
    expect(toRouteState({ [indexName]: {} } as never, indexName)).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
    });
  });

  it('handles a completely empty routeState in toUiState', () => {
    expect(toUiState({}, indexName)).toEqual({
      [indexName]: { query: undefined, page: undefined },
    });
  });

  it('builds a search page URL from index ui state', () => {
    const indexUiState = { query: 'carbon', page: 2, menu: { category: 'Work Style' } };
    expect(getSearchPageURL(indexUiState, indexName)).toBe('/?q=carbon&page=2&kind=Work+Style');
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
      stringify: (params: Record<string, unknown>) =>
        new URLSearchParams(params as Record<string, string>).toString(),
      parse: (str: string) => {
        const params = new URLSearchParams(str);
        const result: Record<string, string | string[]> = {};
        params.forEach((value, key) => {
          if (result[key]) {
            if (Array.isArray(result[key])) {
              result[key].push(value);
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

    it('creates a URL with q, page, and kind', () => {
      const routeState = { q: 'carbon', page: 2, kind: 'Decisions' };
      const location = { origin: 'https://example.com', pathname: '/', search: '' };
      const mockStringify = vi.fn().mockReturnValue('?mocked');
      const url = routerConfig.createURL({
        qsModule: { ...qsModule, stringify: mockStringify },
        routeState,
        location,
      });
      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'carbon', page: 2, kind: 'Decisions' }),
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

    it('parses q, page, and kind from the URL', () => {
      const location = { search: '?q=carbon&page=2&kind=Decisions' };
      expect(routerConfig.parseURL({ qsModule, location })).toEqual({
        q: 'carbon',
        page: 2,
        kind: 'Decisions',
      });
    });

    it('takes the first value when kind appears multiple times', () => {
      const location = { search: '?kind=A&kind=B' };
      expect(routerConfig.parseURL({ qsModule, location }).kind).toBe('A');
    });

    it.each(['?page=invalid', '?page=0', '?page=1', '?page=-5'])(
      'ignores invalid/low page value %s',
      (search) => {
        expect(routerConfig.parseURL({ qsModule, location: { search } }).page).toBeUndefined();
      }
    );
  });
});

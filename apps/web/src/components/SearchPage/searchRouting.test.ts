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

  it('maps uiState to route state with refinements', () => {
    const uiState = {
      [indexName]: {
        page: 2,
        refinementList: {
          category: ['Work Style'],
          projects: ['System Notes'],
          'tags.lvl0': ['Principle'],
          'tags.lvl1': ['Principle > Responsibility'],
        },
      },
    };

    expect(toRouteState(uiState, indexName)).toEqual({
      page: 2,
      category: ['Work Style'],
      projects: ['System Notes'],
      tag0: ['Principle'],
      tag1: ['Principle > Responsibility'],
    });
  });

  it('maps route state back to uiState', () => {
    const routeState = {
      page: 3,
      category: ['Philosophy'],
      projects: ['Hermes Agent'],
      tag0: ['Approach'],
      tag1: ['Approach > Iterative'],
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        page: 3,
        refinementList: {
          category: ['Philosophy'],
          projects: ['Hermes Agent'],
          'tags.lvl0': ['Approach'],
          'tags.lvl1': ['Approach > Iterative'],
        },
      },
    });
  });

  it('omits empty refinements from uiState', () => {
    const routeState = {
      page: undefined,
      category: [],
      projects: [],
      tag0: [],
      tag1: [],
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        page: undefined,
        refinementList: {},
      },
    });
  });

  it('builds a search page URL from index ui state', () => {
    const indexUiState = {
      page: 2,
      refinementList: {
        category: ['Work Style'],
        projects: ['System Notes'],
        'tags.lvl0': ['Approach'],
        'tags.lvl1': ['Approach > Iterative'],
      },
    };

    const url = getSearchPageURL(indexUiState, indexName);

    expect(url).toBe(
      '/?page=2&category=Work+Style&project=System+Notes&tag0=Approach&tag1=Approach+%3E+Iterative'
    );
  });

  it('returns base path when no refinements exist', () => {
    const indexUiState = {
      page: 1,
      refinementList: {},
    };

    const url = getSearchPageURL(indexUiState, indexName);

    expect(url).toBe('/');
  });

  it('respects a custom basePath', () => {
    const url = getSearchPageURL({ refinementList: {} }, indexName, '/search');
    expect(url).toBe('/search');
  });

  it('handles uiState without refinementList gracefully', () => {
    const uiState = { [indexName]: {} };
    expect(toRouteState(uiState as never, indexName)).toEqual({
      page: undefined,
      category: undefined,
      projects: undefined,
      tag0: undefined,
      tag1: undefined,
    });
  });

  it('handles a completely empty routeState in toUiState', () => {
    expect(toUiState({}, indexName)).toEqual({
      [indexName]: {
        page: undefined,
        refinementList: {},
      },
    });
  });

  describe('router configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let routerConfig: any;
    const qsModule = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stringify: (params: Record<string, unknown>, _options: unknown) => {
        return new URLSearchParams(params as Record<string, string>).toString(); // Simple mock
      },
      parse: (str: string) => {
        const params = new URLSearchParams(str);
        const result: Record<string, string | string[]> = {};
        params.forEach((value, key) => {
          if (result[key]) {
            if (Array.isArray(result[key])) {
              result[key].push(value);
            } else {
              result[key] = [result[key], value];
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

    it('generates correct window title', () => {
      expect(routerConfig.windowTitle()).toBe("Choices | Ashley's System Notes");
    });

    it('creates URL correctly', () => {
      const routeState = {
        page: 2,
        category: ['cat1'],
      };
      const location = {
        origin: 'https://example.com',
        pathname: '/search',
        search: '',
      } as unknown as Location;

      const mockStringify = vi.fn().mockReturnValue('mocked-query-string');
      const customQsModule = { ...qsModule, stringify: mockStringify };

      const url = routerConfig.createURL({ qsModule: customQsModule, routeState, location });

      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          category: ['cat1'],
        }),
        expect.any(Object)
      );
      expect(url).toBe('https://example.com/searchmocked-query-string');
    });

    it('preserves factId in createURL when present in the current URL', () => {
      const routeState = {};
      const location = {
        origin: 'https://example.com',
        pathname: '/search',
        search: '?factId=card%3Atest%3Afact%3A001',
      } as unknown as Location;

      const mockStringify = vi.fn().mockReturnValue('mocked-query-string');
      const customQsModule = { ...qsModule, stringify: mockStringify };

      routerConfig.createURL({ qsModule: customQsModule, routeState, location });

      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({ factId: 'card:test:fact:001' }),
        expect.any(Object)
      );
    });

    it('does not inject factId into createURL when absent from current URL', () => {
      const routeState = {};
      const location = {
        origin: 'https://example.com',
        pathname: '/search',
        search: '',
      } as unknown as Location;

      const mockStringify = vi.fn().mockReturnValue('mocked-query-string');
      const customQsModule = { ...qsModule, stringify: mockStringify };

      routerConfig.createURL({ qsModule: customQsModule, routeState, location });

      expect(mockStringify).toHaveBeenCalledWith(
        expect.not.objectContaining({ factId: expect.anything() }),
        expect.any(Object)
      );
    });

    it('parses URL correctly', () => {
      const location = {
        search: '?page=2&category=cat1&project=proj1',
      } as unknown as Location;

      const parsed = routerConfig.parseURL({ qsModule, location });

      expect(parsed).toEqual({
        page: 2,
        category: ['cat1'],
        projects: ['proj1'],
        tag0: [],
        tag1: [],
      });
    });

    it('handles array parameters in parseURL', () => {
      // Our simple mock implementation of qs.parse handles multiple params by creating arrays
      const location = { search: '?category=cat1&category=cat2' } as unknown as Location;
      const parsed = routerConfig.parseURL({ qsModule, location });

      expect(parsed.category).toEqual(['cat1', 'cat2']);
    });

    it('handles invalid page param', () => {
      const location = { search: '?page=invalid' } as unknown as Location;
      const parsed = routerConfig.parseURL({ qsModule, location });
      expect(parsed.page).toBeUndefined();
    });

    it('filters page=0 from parseURL (below valid range)', () => {
      const location = { search: '?page=0' } as unknown as Location;
      const parsed = routerConfig.parseURL({ qsModule, location });
      expect(parsed.page).toBeUndefined();
    });

    it('filters page=1 from parseURL (first page is the default, not serialised)', () => {
      const location = { search: '?page=1' } as unknown as Location;
      const parsed = routerConfig.parseURL({ qsModule, location });
      expect(parsed.page).toBeUndefined();
    });

    it('filters negative page from parseURL', () => {
      const location = { search: '?page=-5' } as unknown as Location;
      const parsed = routerConfig.parseURL({ qsModule, location });
      expect(parsed.page).toBeUndefined();
    });

    it('creates URL with no query string when routeState is empty', () => {
      const location = {
        origin: 'https://example.com',
        pathname: '/search',
        search: '',
      } as unknown as Location;
      const mockStringify = vi.fn().mockReturnValue('');
      const customQsModule = { ...qsModule, stringify: mockStringify };

      const url = routerConfig.createURL({ qsModule: customQsModule, routeState: {}, location });

      expect(mockStringify).toHaveBeenCalledWith({}, expect.any(Object));
      expect(url).toBe('https://example.com/search');
    });
  });
});

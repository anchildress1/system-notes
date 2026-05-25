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
        },
        hierarchicalMenu: {
          'tags.lvl0': ['Principle > Responsibility'],
        },
      },
    };

    expect(toRouteState(uiState, indexName)).toEqual({
      page: 2,
      category: ['Work Style'],
      projects: ['System Notes'],
      tags: 'Principle > Responsibility',
    });
  });

  it('maps uiState with a top-level tag selection', () => {
    const uiState = {
      [indexName]: {
        hierarchicalMenu: {
          'tags.lvl0': ['Principle'],
        },
      },
    };

    expect(toRouteState(uiState, indexName)).toEqual({
      page: undefined,
      category: undefined,
      projects: undefined,
      tags: 'Principle',
    });
  });

  it('maps route state back to uiState', () => {
    const routeState = {
      page: 3,
      category: ['Philosophy'],
      projects: ['Hermes Agent'],
      tags: 'Approach > Iterative',
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        page: 3,
        refinementList: {
          category: ['Philosophy'],
          projects: ['Hermes Agent'],
        },
        hierarchicalMenu: {
          'tags.lvl0': ['Approach > Iterative'],
        },
      },
    });
  });

  it('omits empty refinements and hierarchicalMenu from uiState', () => {
    const routeState = {
      page: undefined,
      category: [],
      projects: [],
      tags: undefined,
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        page: undefined,
        refinementList: {},
        hierarchicalMenu: undefined,
      },
    });
  });

  it('builds a search page URL from index ui state', () => {
    const indexUiState = {
      page: 2,
      refinementList: {
        category: ['Work Style'],
        projects: ['System Notes'],
      },
      hierarchicalMenu: {
        'tags.lvl0': ['Approach > Iterative'],
      },
    };

    const url = getSearchPageURL(indexUiState, indexName);

    expect(url).toBe(
      '/?page=2&category=Work+Style&project=System+Notes&tags=Approach+%3E+Iterative'
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

  it('handles uiState without refinementList or hierarchicalMenu gracefully', () => {
    const uiState = { [indexName]: {} };
    expect(toRouteState(uiState as never, indexName)).toEqual({
      page: undefined,
      category: undefined,
      projects: undefined,
      tags: undefined,
    });
  });

  it('handles a completely empty routeState in toUiState', () => {
    expect(toUiState({}, indexName)).toEqual({
      [indexName]: {
        page: undefined,
        refinementList: {},
        hierarchicalMenu: undefined,
      },
    });
  });

  describe('router configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let routerConfig: any;
    const qsModule = {
      stringify: (params: Record<string, unknown>, _options: unknown) => {
        return new URLSearchParams(params as Record<string, string>).toString();
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

    it('serialises tags into URL', () => {
      const routeState = { tags: 'Approach > Iterative' };
      const location = {
        origin: 'https://example.com',
        pathname: '/search',
        search: '',
      } as unknown as Location;

      const mockStringify = vi.fn().mockReturnValue('mocked');
      const customQsModule = { ...qsModule, stringify: mockStringify };

      routerConfig.createURL({ qsModule: customQsModule, routeState, location });

      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({ tags: 'Approach > Iterative' }),
        expect.any(Object)
      );
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
        tags: undefined,
      });
    });

    it('parses tags from URL', () => {
      const location = {
        search: '?tags=Approach+%3E+Iterative',
      } as unknown as Location;

      const parsed = routerConfig.parseURL({ qsModule, location });

      expect(parsed.tags).toBe('Approach > Iterative');
    });

    it('ignores array tags param (invalid — tags must be a single string)', () => {
      // If somehow duplicate tags params appear, only a string value is accepted
      const location = {
        search: '?tags=Approach&tags=Events',
      } as unknown as Location;

      const parsed = routerConfig.parseURL({ qsModule, location });

      // Array value is rejected; tags should be undefined
      expect(parsed.tags).toBeUndefined();
    });

    it('handles array parameters in parseURL for category', () => {
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

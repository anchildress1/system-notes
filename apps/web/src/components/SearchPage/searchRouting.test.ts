import { describe, it, expect } from 'vitest';
import { toRouteState, toUiState, getSearchPageURL } from './searchRouting';

const indexName = 'system-notes';

describe('searchRouting', () => {
  it('maps uiState to route state with refinements', () => {
    const uiState = {
      [indexName]: {
        query: 'agent design',
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
      query: 'agent design',
      page: 2,
      category: ['Work Style'],
      projects: ['System Notes'],
      tag0: ['Principle'],
      tag1: ['Principle > Responsibility'],
    });
  });

  it('maps route state back to uiState', () => {
    const routeState = {
      query: 'portfolio',
      page: 3,
      category: ['Philosophy'],
      projects: ['Hermes Agent'],
      tag0: ['Approach'],
      tag1: ['Approach > Iterative'],
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        query: 'portfolio',
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
      query: 'ai',
      page: undefined,
      category: [],
      projects: [],
      tag0: [],
      tag1: [],
    };

    expect(toUiState(routeState, indexName)).toEqual({
      [indexName]: {
        query: 'ai',
        page: undefined,
        refinementList: {},
      },
    });
  });

  it('builds a search page URL from index ui state', () => {
    const indexUiState = {
      query: 'ai workflows',
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
      '/?query=ai+workflows&page=2&category=Work+Style&project=System+Notes&tag0=Approach&tag1=Approach+%3E+Iterative'
    );
  });

  it('returns base path when no refinements exist', () => {
    const indexUiState = {
      query: '',
      page: 1,
      refinementList: {},
    };

    const url = getSearchPageURL(indexUiState, indexName);

    expect(url).toBe('/');
  });
});

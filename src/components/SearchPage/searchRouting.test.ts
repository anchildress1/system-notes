import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchRouting, getSearchPageURL, toRouteState, toUiState } from './searchRouting';

const { mockHistory } = vi.hoisted(() => ({ mockHistory: vi.fn() }));
vi.mock('instantsearch.js/es/lib/routers', () => ({
  history: (config: Record<string, unknown>) => {
    mockHistory(config);
    return { ...config, dispose: vi.fn() };
  },
}));

const indexName = 'system-notes';

describe('searchRouting', () => {
  beforeEach(() => mockHistory.mockClear());

  it('maps query, page, and refinements to route state', () => {
    expect(
      toRouteState(
        {
          [indexName]: {
            query: 'carbon',
            page: 2,
            refinementList: {
              category: ['Decision', 'Principle'],
              projects: ['Vestige'],
              'tags.lvl0': ['Engineering', 'Design'],
            },
          },
        },
        indexName
      )
    ).toEqual({
      q: 'carbon',
      page: 2,
      kind: ['Decision', 'Principle'],
      project: ['Vestige'],
      tag: ['Engineering', 'Design'],
    });
  });

  it('omits empty query and refinement lists', () => {
    expect(
      toRouteState(
        {
          [indexName]: {
            query: '',
            refinementList: { category: [], projects: [], 'tags.lvl0': [] },
          },
        },
        indexName
      )
    ).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
  });

  it('maps route state back to multi-select refinement state', () => {
    expect(
      toUiState(
        {
          q: 'agents',
          page: 3,
          kind: ['Philosophy'],
          project: ['Vestige'],
          tag: ['Engineering'],
        },
        indexName
      )
    ).toEqual({
      [indexName]: {
        query: 'agents',
        page: 3,
        refinementList: {
          category: ['Philosophy'],
          projects: ['Vestige'],
          'tags.lvl0': ['Engineering'],
        },
      },
    });
  });

  it.each([
    { route: { kind: ['P'] }, attribute: 'category' },
    { route: { project: ['V'] }, attribute: 'projects' },
    { route: { tag: ['TypeScript'] }, attribute: 'tags.lvl0' },
  ])('maps an isolated $attribute refinement', ({ route, attribute }) => {
    expect(toUiState(route, indexName)[indexName]?.refinementList).toEqual({
      [attribute]: Object.values(route)[0],
    });
  });

  it('omits refinementList when no facets are selected', () => {
    expect(toUiState({ q: 'x', page: 2, kind: [], project: [], tag: [] }, indexName)).toEqual({
      [indexName]: { query: 'x', page: 2 },
    });
  });

  it('handles empty UI and route state', () => {
    expect(toRouteState({ [indexName]: {} }, indexName)).toEqual({
      q: undefined,
      page: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
    expect(toUiState({}, indexName)).toEqual({
      [indexName]: { query: undefined, page: undefined },
    });
  });

  it('uses the default InstantSearch history router', () => {
    const routing = createSearchRouting(indexName);
    const config = mockHistory.mock.calls[0][0];

    expect(config).toMatchObject({ cleanUrlOnDispose: false });
    expect(config).not.toHaveProperty('createURL');
    expect(config).not.toHaveProperty('parseURL');
    expect(config).not.toHaveProperty('windowTitle');
    expect(routing.stateMapping.stateToRoute({ [indexName]: { query: 'x' } })).toEqual({
      q: 'x',
      page: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
  });

  it('builds a URL with repeated facet values', () => {
    expect(
      getSearchPageURL(
        {
          query: 'carbon',
          page: 2,
          refinementList: { category: ['Work Style', 'Decisions'] },
        },
        indexName
      )
    ).toBe('/choices?q=carbon&page=2&kind=Work+Style&kind=Decisions');
  });

  it('returns the requested base path for empty state', () => {
    expect(getSearchPageURL({}, indexName)).toBe('/choices');
    expect(getSearchPageURL({}, indexName, '/elsewhere')).toBe('/elsewhere');
  });
});

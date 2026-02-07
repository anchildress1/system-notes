import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

export type SearchRouteState = {
  query?: string;
  page?: number;
  category?: string[];
  projects?: string[];
  tag0?: string[];
  tag1?: string[];
};

const normalizeArrayParam = (value?: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return typeof value === 'string' ? [value] : [];
};

const withValues = (values?: string[]): string[] | undefined => {
  if (!values || values.length === 0) return undefined;
  return values;
};

const parsePageParam = (value?: unknown): number | undefined => {
  if (!value) return undefined;
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== 'string') return undefined;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 1) return undefined;
  return parsed;
};

export const toRouteState = (uiState: UiState, indexName: string): SearchRouteState => {
  const indexState = uiState[indexName] || {};

  return {
    query: indexState.query,
    page: indexState.page,
    category: withValues(indexState.refinementList?.category),
    projects: withValues(indexState.refinementList?.projects),
    tag0: withValues(indexState.refinementList?.['tags.lvl0']),
    tag1: withValues(indexState.refinementList?.['tags.lvl1']),
  };
};

export const toUiState = (routeState: SearchRouteState, indexName: string): UiState => {
  const refinementList: Record<string, string[] | undefined> = {
    category: withValues(routeState.category),
    projects: withValues(routeState.projects),
    'tags.lvl0': withValues(routeState.tag0),
    'tags.lvl1': withValues(routeState.tag1),
  };

  const cleanedRefinements = Object.fromEntries(
    Object.entries(refinementList).filter(([, value]) => value && value.length > 0)
  ) as Record<string, string[]>;

  return {
    [indexName]: {
      query: routeState.query,
      page: routeState.page,
      refinementList: cleanedRefinements,
    },
  };
};

export const createSearchRouting = (indexName: string) => ({
  router: history<SearchRouteState>({
    windowTitle(routeState) {
      const query = routeState.query?.trim();
      return query ? `Fact Index: ${query}` : 'Fact Index';
    },
    cleanUrlOnDispose: false,
    createURL({ qsModule, routeState, location }) {
      const queryParameters: Record<string, string | string[] | number> = {};

      if (routeState.query) queryParameters.query = routeState.query;
      if (routeState.page && routeState.page > 1) queryParameters.page = routeState.page;
      if (routeState.category?.length) queryParameters.category = routeState.category;
      if (routeState.projects?.length) queryParameters.project = routeState.projects;
      if (routeState.tag0?.length) queryParameters.tag0 = routeState.tag0;
      if (routeState.tag1?.length) queryParameters.tag1 = routeState.tag1;

      const queryString = qsModule.stringify(queryParameters, {
        addQueryPrefix: true,
        arrayFormat: 'repeat',
        encodeValuesOnly: true,
      });

      return `${location.pathname}${queryString}`;
    },
    parseURL({ qsModule, location }) {
      const parsedParams = qsModule.parse(location.search.slice(1));
      const queryValue = Array.isArray(parsedParams.query)
        ? parsedParams.query[0]
        : parsedParams.query;

      return {
        query: typeof queryValue === 'string' ? queryValue : '',
        page: parsePageParam(parsedParams.page),
        category: normalizeArrayParam(parsedParams.category),
        projects: normalizeArrayParam(parsedParams.project),
        tag0: normalizeArrayParam(parsedParams.tag0),
        tag1: normalizeArrayParam(parsedParams.tag1),
      };
    },
  }),
  stateMapping: {
    stateToRoute(uiState: UiState) {
      return toRouteState(uiState, indexName);
    },
    routeToState(routeState: SearchRouteState) {
      return toUiState(routeState, indexName);
    },
  },
});

export const getSearchPageURL = (
  indexUiState: IndexUiState,
  indexName: string,
  basePath = '/'
): string => {
  const routeState = toRouteState({ [indexName]: indexUiState } as UiState, indexName);
  const params = new URLSearchParams();

  if (routeState.query) params.set('query', routeState.query);
  if (routeState.page && routeState.page > 1) params.set('page', String(routeState.page));
  routeState.category?.forEach((value) => params.append('category', value));
  routeState.projects?.forEach((value) => params.append('project', value));
  routeState.tag0?.forEach((value) => params.append('tag0', value));
  routeState.tag1?.forEach((value) => params.append('tag1', value));

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

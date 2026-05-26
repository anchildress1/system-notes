import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

export type SearchRouteState = {
  page?: number;
  category?: string[];
  projects?: string[];
  tags?: string[];
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
    page: indexState.page,
    category: withValues(indexState.refinementList?.category),
    projects: withValues(indexState.refinementList?.projects),
    tags: withValues(indexState.refinementList?.['tags.lvl1']),
  };
};

export const toUiState = (routeState: SearchRouteState, indexName: string): UiState => {
  const refinementList: Record<string, string[] | undefined> = {
    category: withValues(routeState.category),
    projects: withValues(routeState.projects),
    'tags.lvl1': withValues(routeState.tags),
  };

  const cleanedRefinements = Object.fromEntries(
    Object.entries(refinementList).filter(([, value]) => value && value.length > 0)
  ) as Record<string, string[]>;

  return {
    [indexName]: {
      page: routeState.page,
      refinementList: cleanedRefinements,
    },
  };
};

export const createSearchRouting = (indexName: string) => ({
  router: history<SearchRouteState>({
    windowTitle() {
      return "Choices | Ashley's System Notes";
    },
    cleanUrlOnDispose: false,
    createURL({ qsModule, routeState, location }) {
      const queryParameters: Record<string, string | string[] | number> = {};

      if (routeState.page && routeState.page > 1) queryParameters.page = routeState.page;
      if (routeState.category?.length) queryParameters.category = routeState.category;
      if (routeState.projects?.length) queryParameters.project = routeState.projects;
      if (routeState.tags?.length) queryParameters.tags = routeState.tags;

      // Pass factId through as an opaque param — it is owned by useFactIdRouting,
      // not by InstantSearch. Without this, InstantSearch would strip it from the
      // URL on every route update, breaking the deep-link overlay.
      const existingParams = qsModule.parse(location.search.slice(1));
      if (existingParams.factId) {
        queryParameters.factId = existingParams.factId as string;
      }

      const queryString = qsModule.stringify(queryParameters, {
        addQueryPrefix: true,
        arrayFormat: 'repeat',
        encodeValuesOnly: true,
      });

      return `${location.origin}${location.pathname}${queryString}`;
    },
    parseURL({ qsModule, location }) {
      const parsedParams = qsModule.parse(location.search.slice(1));

      return {
        page: parsePageParam(parsedParams.page),
        category: normalizeArrayParam(parsedParams.category),
        projects: normalizeArrayParam(parsedParams.project),
        tags: normalizeArrayParam(parsedParams.tags),
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

  if (routeState.page && routeState.page > 1) params.set('page', String(routeState.page));
  routeState.category?.forEach((value) => params.append('category', value));
  routeState.projects?.forEach((value) => params.append('project', value));
  routeState.tags?.forEach((value) => params.append('tags', value));

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

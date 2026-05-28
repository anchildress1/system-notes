import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

const KIND_ATTRIBUTE = 'category';

export type SearchRouteState = {
  q?: string;
  page?: number;
  kind?: string; // selected category (single-select kind chip)
};

const parsePageParam = (value?: unknown): number | undefined => {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 1) return undefined;
  return parsed;
};

const asString = (value?: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) return value[0];
  return undefined;
};

export const toRouteState = (uiState: UiState, indexName: string): SearchRouteState => {
  const indexState = uiState[indexName] || {};
  const kind = indexState.menu?.[KIND_ATTRIBUTE];
  return {
    q: indexState.query || undefined,
    page: indexState.page,
    kind: kind || undefined,
  };
};

export const toUiState = (routeState: SearchRouteState, indexName: string): UiState => ({
  [indexName]: {
    query: routeState.q,
    page: routeState.page,
    ...(routeState.kind ? { menu: { [KIND_ATTRIBUTE]: routeState.kind } } : {}),
  },
});

export const createSearchRouting = (indexName: string) => ({
  router: history<SearchRouteState>({
    windowTitle() {
      return "Choices | Ashley's System Notes";
    },
    cleanUrlOnDispose: false,
    createURL({ qsModule, routeState, location }) {
      const queryParameters: Record<string, string | number> = {};

      if (routeState.q) queryParameters.q = routeState.q;
      if (routeState.page && routeState.page > 1) queryParameters.page = routeState.page;
      if (routeState.kind) queryParameters.kind = routeState.kind;

      // Passthrough: factId is an Algolia click-analytics correlator (objectID).
      // InstantSearch's router strips any param it doesn't own; re-inject it
      // from the current URL so click→conversion tracking survives state updates.
      const existingParams = qsModule.parse(location.search.slice(1));
      if (existingParams.factId) {
        queryParameters.factId = existingParams.factId as string;
      }

      const queryString = qsModule.stringify(queryParameters, {
        addQueryPrefix: true,
        encodeValuesOnly: true,
      });

      return `${location.origin}${location.pathname}${queryString}`;
    },
    parseURL({ qsModule, location }) {
      const parsed = qsModule.parse(location.search.slice(1));
      return {
        q: asString(parsed.q),
        page: parsePageParam(parsed.page),
        kind: asString(parsed.kind),
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

  if (routeState.q) params.set('q', routeState.q);
  if (routeState.page && routeState.page > 1) params.set('page', String(routeState.page));
  if (routeState.kind) params.set('kind', routeState.kind);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

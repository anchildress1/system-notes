import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

const KIND_ATTRIBUTE = 'category';
const PROJECT_ATTRIBUTE = 'projects';
const TAG_ATTRIBUTE = 'tags.lvl0';

export type SearchRouteState = {
  q?: string;
  page?: number;
  kind?: string; // selected category (single-select kind chip)
  project?: string; // selected project (single-select project chip)
  tag?: string; // selected tags.lvl0 (single-select tag chip)
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
  return {
    q: indexState.query || undefined,
    page: indexState.page,
    kind: indexState.menu?.[KIND_ATTRIBUTE] || undefined,
    project: indexState.menu?.[PROJECT_ATTRIBUTE] || undefined,
    tag: indexState.menu?.[TAG_ATTRIBUTE] || undefined,
  };
};

export const toUiState = (routeState: SearchRouteState, indexName: string): UiState => {
  const menu: Record<string, string> = {};
  if (routeState.kind) menu[KIND_ATTRIBUTE] = routeState.kind;
  if (routeState.project) menu[PROJECT_ATTRIBUTE] = routeState.project;
  if (routeState.tag) menu[TAG_ATTRIBUTE] = routeState.tag;
  return {
    [indexName]: {
      query: routeState.q,
      page: routeState.page,
      ...(Object.keys(menu).length > 0 ? { menu } : {}),
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
      const queryParameters: Record<string, string | number> = {};

      if (routeState.q) queryParameters.q = routeState.q;
      if (routeState.page && routeState.page > 1) queryParameters.page = routeState.page;
      if (routeState.kind) queryParameters.kind = routeState.kind;
      if (routeState.project) queryParameters.project = routeState.project;
      if (routeState.tag) queryParameters.tag = routeState.tag;

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
        project: asString(parsed.project),
        tag: asString(parsed.tag),
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
  if (routeState.project) params.set('project', routeState.project);
  if (routeState.tag) params.set('tag', routeState.tag);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

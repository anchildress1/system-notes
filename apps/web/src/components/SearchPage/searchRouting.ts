import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

const KIND_ATTRIBUTE = 'category';
const PROJECT_ATTRIBUTE = 'projects';
const TAG_ATTRIBUTE = 'tags.lvl0';

export type SearchRouteState = {
  q?: string;
  page?: number;
  // Each facet is a list — multi-select via useRefinementList.
  kind?: string[];
  project?: string[];
  tag?: string[];
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

// Normalize query-string facet values: qs returns a single string for one
// occurrence and an array for repeated keys. Squash both into a clean string[]
// (or undefined when empty).
const asArray = (value?: unknown): string[] | undefined => {
  if (typeof value === 'string' && value.length > 0) return [value];
  if (Array.isArray(value)) {
    const cleaned = value.filter((v): v is string => typeof v === 'string' && v.length > 0);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  return undefined;
};

export const toRouteState = (uiState: UiState, indexName: string): SearchRouteState => {
  const indexState = uiState[indexName] || {};
  const refinementList = indexState.refinementList || {};
  return {
    q: indexState.query || undefined,
    page: indexState.page,
    kind: refinementList[KIND_ATTRIBUTE]?.length ? refinementList[KIND_ATTRIBUTE] : undefined,
    project: refinementList[PROJECT_ATTRIBUTE]?.length
      ? refinementList[PROJECT_ATTRIBUTE]
      : undefined,
    tag: refinementList[TAG_ATTRIBUTE]?.length ? refinementList[TAG_ATTRIBUTE] : undefined,
  };
};

export const toUiState = (routeState: SearchRouteState, indexName: string): UiState => {
  const refinementList: Record<string, string[]> = {};
  if (routeState.kind?.length) refinementList[KIND_ATTRIBUTE] = routeState.kind;
  if (routeState.project?.length) refinementList[PROJECT_ATTRIBUTE] = routeState.project;
  if (routeState.tag?.length) refinementList[TAG_ATTRIBUTE] = routeState.tag;
  return {
    [indexName]: {
      query: routeState.q,
      page: routeState.page,
      ...(Object.keys(refinementList).length > 0 ? { refinementList } : {}),
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
      const queryParameters: Record<string, string | number | string[]> = {};

      if (routeState.q) queryParameters.q = routeState.q;
      if (routeState.page && routeState.page > 1) queryParameters.page = routeState.page;
      if (routeState.kind?.length) queryParameters.kind = routeState.kind;
      if (routeState.project?.length) queryParameters.project = routeState.project;
      if (routeState.tag?.length) queryParameters.tag = routeState.tag;

      // Passthrough: factId is an Algolia click-analytics correlator (objectID).
      // InstantSearch's router strips any param it doesn't own; re-inject it
      // from the current URL so click→conversion tracking survives state updates.
      const existingParams = qsModule.parse(location.search.slice(1));
      if (existingParams.factId) {
        queryParameters.factId = existingParams.factId as string;
      }

      // arrayFormat: 'repeat' produces ?kind=A&kind=B instead of indexed keys.
      const queryString = qsModule.stringify(queryParameters, {
        addQueryPrefix: true,
        encodeValuesOnly: true,
        arrayFormat: 'repeat',
      });

      return `${location.origin}${location.pathname}${queryString}`;
    },
    parseURL({ qsModule, location }) {
      const parsed = qsModule.parse(location.search.slice(1));
      return {
        q: asString(parsed.q),
        page: parsePageParam(parsed.page),
        kind: asArray(parsed.kind),
        project: asArray(parsed.project),
        tag: asArray(parsed.tag),
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
  for (const v of routeState.kind ?? []) params.append('kind', v);
  for (const v of routeState.project ?? []) params.append('project', v);
  for (const v of routeState.tag ?? []) params.append('tag', v);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

import { history } from 'instantsearch.js/es/lib/routers';
import type { IndexUiState, UiState } from 'instantsearch.js';

// Only these three facets are intentionally URL-addressable. Dynamic facets rendered
// via useDynamicWidgets are ephemeral — see AGENTS.md § URL State Architecture.
const KIND_ATTRIBUTE = 'category';
const PROJECT_ATTRIBUTE = 'projects';
const TAG_ATTRIBUTE = 'tags.lvl0';

export type SearchRouteState = {
  q?: string;
  page?: number;
  kind?: string[];
  project?: string[];
  tag?: string[];
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
    cleanUrlOnDispose: false,
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
  basePath = '/choices'
): string => {
  const routeState = toRouteState({ [indexName]: indexUiState }, indexName);
  const params = new URLSearchParams();

  if (routeState.q) params.set('q', routeState.q);
  if (routeState.page && routeState.page > 1) params.set('page', String(routeState.page));
  for (const v of routeState.kind ?? []) params.append('kind', v);
  for (const v of routeState.project ?? []) params.append('project', v);
  for (const v of routeState.tag ?? []) params.append('tag', v);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

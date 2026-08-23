import { history } from 'instantsearch.js/es/lib/routers';
import type { UiState } from 'instantsearch.js';

const CATEGORY_ATTRIBUTE = 'category';
const PROJECT_ATTRIBUTE = 'projects';
const TAG_ATTRIBUTE = 'tags.lvl0';

type RouteValue = string | string[];

export type SearchRouteState = {
  q?: unknown;
  kind?: unknown;
  project?: unknown;
  tag?: unknown;
};

function toList(value: unknown): string[] | undefined {
  let values: string[] = [];
  if (typeof value === 'string') values = [value];
  else if (Array.isArray(value)) values = value;
  const normalized = values.flatMap((item) => {
    if (typeof item !== 'string') return [];
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });
  return normalized.length > 0 ? normalized : undefined;
}

function toRouteValue(values: string[] | undefined): RouteValue | undefined {
  if (!values?.length) return undefined;
  return values.length === 1 ? values[0] : values;
}

function toQuery(value: unknown): string | undefined {
  return toList(value)?.[0];
}

export function toRouteState(uiState: UiState, indexName: string): SearchRouteState {
  const indexState = uiState[indexName] ?? {};
  const refinementList = indexState.refinementList ?? {};
  return {
    q: indexState.query || undefined,
    kind: toRouteValue(refinementList[CATEGORY_ATTRIBUTE]),
    project: toRouteValue(refinementList[PROJECT_ATTRIBUTE]),
    tag: toRouteValue(refinementList[TAG_ATTRIBUTE]),
  };
}

export function toUiState(routeState: SearchRouteState, indexName: string): UiState {
  const refinementList: Record<string, string[]> = {};
  const categories = toList(routeState.kind);
  const projects = toList(routeState.project);
  const tags = toList(routeState.tag);

  if (categories) refinementList[CATEGORY_ATTRIBUTE] = categories;
  if (projects) refinementList[PROJECT_ATTRIBUTE] = projects;
  if (tags) refinementList[TAG_ATTRIBUTE] = tags;

  return {
    [indexName]: {
      query: toQuery(routeState.q),
      ...(Object.keys(refinementList).length > 0 ? { refinementList } : {}),
    },
  };
}

export function createSearchRouting(indexName: string) {
  return {
    router: history<SearchRouteState>({ cleanUrlOnDispose: false }),
    stateMapping: {
      stateToRoute(uiState: UiState) {
        return toRouteState(uiState, indexName);
      },
      routeToState(routeState: SearchRouteState) {
        return toUiState(routeState, indexName);
      },
    },
  };
}

export function getProjectNotesURL(projectTitle: string): string {
  const title = projectTitle.trim();
  if (!title) return '/notes#notes-index';
  const params = new URLSearchParams({ project: title });
  return `/notes?${params.toString()}#notes-index`;
}

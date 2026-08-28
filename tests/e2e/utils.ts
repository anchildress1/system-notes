import { test as base, type Page } from '@playwright/test';

export type MockAlgoliaHit = {
  objectID: string;
  title: string;
  blurb?: string;
  fact?: string;
  content?: string;
  category?: string;
  projects?: string[];
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  url?: string;
  created_at?: string;
  __position?: number;
};

const ALGOLIA_SEARCH_ROUTE = /\/1\/indexes\/[^/]+\/queries(?:\?|$)/;

/* Insights is a SEPARATE host from search — https://insights.algolia.io/1/events —
   so narrowing the search route to /queries left it outside the fake boundary.
   IndexWorkspace.selectNote calls sendEvent on every selection, which made a
   note click reach the real provider from an E2E run and left the one event the
   architecture requires unverified. Matched on the path so the Agent Studio
   route, which is neither of these, stays untouched. */
const ALGOLIA_INSIGHTS_ROUTE = /\/1\/events(?:\?|$)/;

interface MockAlgoliaOptions {
  nbHits?: number;
  facets?: Record<string, Record<string, number>>;
  onRequest?: (params: URLSearchParams) => void;
}

function normalizeRequestParams(request: Record<string, unknown>): URLSearchParams {
  const legacyParams = request['params'];
  const params = new URLSearchParams(typeof legacyParams === 'string' ? legacyParams : '');

  for (const [key, value] of Object.entries(request)) {
    if (key === 'indexName' || key === 'params' || value === undefined) continue;
    params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return params;
}

function countFacets(hits: MockAlgoliaHit[]) {
  return {
    projects: hits.reduce<Record<string, number>>((counts, hit) => {
      for (const project of hit.projects ?? []) counts[project] = (counts[project] ?? 0) + 1;
      return counts;
    }, {}),
    category: hits.reduce<Record<string, number>>((counts, hit) => {
      if (hit.category) counts[hit.category] = (counts[hit.category] ?? 0) + 1;
      return counts;
    }, {}),
    'tags.lvl0': hits.reduce<Record<string, number>>((counts, hit) => {
      for (const tag of hit['tags.lvl0'] ?? []) counts[tag] = (counts[tag] ?? 0) + 1;
      return counts;
    }, {}),
  };
}

export async function mockAlgoliaSearch(
  page: Page,
  hits: MockAlgoliaHit[],
  options: MockAlgoliaOptions = {}
) {
  await page.unroute(ALGOLIA_SEARCH_ROUTE);
  await page.route(ALGOLIA_SEARCH_ROUTE, async (route) => {
    let requests: Array<Record<string, unknown>> = [{}];
    try {
      const payload = route.request().postDataJSON() as { requests?: unknown[] };
      if (Array.isArray(payload.requests) && payload.requests.length > 0) {
        requests = payload.requests.filter(
          (request): request is Record<string, unknown> =>
            Boolean(request) && typeof request === 'object'
        );
      }
    } catch {
      requests = [{}];
    }

    const results = requests.map((request) => {
      const params = normalizeRequestParams(request);
      options.onRequest?.(params);
      const requestedPage = Number(params.get('page') ?? '0');
      const resultPage =
        Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
      const requestedHitsPerPage = Number(params.get('hitsPerPage') ?? '500');
      const hitsPerPage =
        Number.isSafeInteger(requestedHitsPerPage) && requestedHitsPerPage > 0
          ? requestedHitsPerPage
          : 500;
      const totalHits = options.nbHits ?? hits.length;
      const resultHits = hits.slice(
        resultPage * hitsPerPage,
        resultPage * hitsPerPage + hitsPerPage
      );
      const positionedHits = resultHits.map((hit, index) => ({
        ...hit,
        __position: hit.__position ?? resultPage * hitsPerPage + index + 1,
      }));

      return {
        hits: positionedHits,
        nbHits: totalHits,
        page: resultPage,
        nbPages: Math.ceil(totalHits / hitsPerPage),
        hitsPerPage,
        processingTimeMS: 1,
        exhaustiveNbHits: true,
        // Present on every real response, and what attributes a click back to
        // the search that produced it. Without one the event still sends, but
        // as an unattributed click, which is not the shape the site emits.
        queryID: 'mock-query-id',
        query: params.get('query') ?? '',
        params: params.toString(),
        index: 'system-notes',
        facets: options.facets ?? countFacets(positionedHits),
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results }),
    });
  });
}

/** One entry of an Insights batch, as the client posts it. */
export type CapturedInsightsEvent = {
  eventType?: string;
  eventName?: string;
  index?: string;
  objectIDs?: string[];
  positions?: number[];
  queryID?: string;
};

/**
 * Intercepts the Insights endpoint and collects what the page tried to send.
 *
 * @param page The page to route.
 * @returns A live array, appended to as events arrive. Read it after the action
 *   that should have sent one.
 */
export async function mockAlgoliaInsights(page: Page): Promise<CapturedInsightsEvent[]> {
  const events: CapturedInsightsEvent[] = [];

  await page.unroute(ALGOLIA_INSIGHTS_ROUTE);
  await page.route(ALGOLIA_INSIGHTS_ROUTE, async (route) => {
    try {
      const payload = route.request().postDataJSON() as { events?: CapturedInsightsEvent[] };
      if (Array.isArray(payload?.events)) events.push(...payload.events);
    } catch {
      // A body that will not parse is still a request that must not leave the
      // machine; fulfilling it matters more than recording it.
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'OK' }),
    });
  });

  return events;
}

export const test = base.extend<{
  autoMockAlgolia: void;
  insightsEvents: CapturedInsightsEvent[];
}>({
  insightsEvents: [
    async ({ page }, use) => {
      await use(await mockAlgoliaInsights(page));
    },
    { scope: 'test' },
  ],
  autoMockAlgolia: [
    // Depends on insightsEvents so the stub is installed for EVERY spec, not
    // only the ones that assert on it — an unstubbed spec would reach the real
    // provider the first time anything is selected.
    async ({ page, insightsEvents }, use) => {
      void insightsEvents;
      await mockAlgoliaSearch(page, []);
      await use();
    },
    { auto: true },
  ],
});

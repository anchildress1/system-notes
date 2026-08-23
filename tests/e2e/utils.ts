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
  await page.unroute('**/*algolia*/**');
  await page.route('**/*algolia*/**', async (route) => {
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

export const test = base.extend<{ autoMockAlgolia: void }>({
  autoMockAlgolia: [
    async ({ page }, use) => {
      await mockAlgoliaSearch(page, []);
      await use();
    },
    { auto: true },
  ],
});

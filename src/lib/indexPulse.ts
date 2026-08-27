import { cache } from 'react';
import { algoliasearch } from 'algoliasearch';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';

/** How long a pulse is reused before the index is asked again. */
export const PULSE_TTL_MS = 5 * 60_000;

/** How long the index gets to answer before the header gives up on it. */
const PULSE_DEADLINE_MS = 3_000;

/**
 * The index's own vital signs: how many notes it holds, and when the newest
 * one was filed.
 */
export interface IndexPulse {
  /** Total notes in the index. */
  total: number;
  /** ISO timestamp of the most recently created note, or null if none carried one. */
  latestCreatedAt: string | null;
}

const pulseClient = hasValidAlgoliaCredentials()
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
  : null;

let cached: { at: number; value: IndexPulse | null } | null = null;

/**
 * Picks the newest usable timestamp out of a set of records.
 *
 * @param hits Records that may carry a `created_at`.
 * @returns The latest ISO timestamp, or null when none of them parse.
 */
export function latestTimestamp(hits: readonly { created_at?: unknown }[]): string | null {
  let newest = Number.NEGATIVE_INFINITY;
  let iso: string | null = null;
  for (const hit of hits) {
    if (typeof hit.created_at !== 'string') continue;
    const time = Date.parse(hit.created_at);
    // An unparseable date is data to skip, not a reason to report nothing.
    if (Number.isNaN(time) || time <= newest) continue;
    newest = time;
    iso = hit.created_at;
  }
  return iso;
}

function withDeadline<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = globalThis.setTimeout(
      () => reject(new Error('Index pulse exceeded its response deadline.')),
      PULSE_DEADLINE_MS
    );
  });
  return Promise.race([request, deadline]).finally(() => {
    if (timer) globalThis.clearTimeout(timer);
  });
}

/**
 * Reads the index's total and newest-filed date for the header.
 *
 * The index has no date-sorted replica, so every record is fetched with only
 * `created_at` retrieved — a few hundred one-field objects — and the newest is
 * taken from those. Held for {@link PULSE_TTL_MS} so the header does not query
 * the index once per page view.
 *
 * @returns The pulse, or null when the index cannot answer. Null is a normal
 *   outcome and the header is expected to render without it.
 */
export const getIndexPulse = cache(async (): Promise<IndexPulse | null> => {
  if (!pulseClient) return null;
  if (cached && Date.now() - cached.at < PULSE_TTL_MS) return cached.value;

  try {
    const response = await withDeadline(
      pulseClient.searchSingleIndex<{ created_at?: unknown }>({
        indexName: ALGOLIA_INDEX_NAME,
        searchParams: {
          query: '',
          hitsPerPage: 1000,
          attributesToRetrieve: ['created_at'],
        },
      })
    );
    const value: IndexPulse = {
      total: typeof response.nbHits === 'number' ? response.nbHits : response.hits.length,
      latestCreatedAt: latestTimestamp(response.hits),
    };
    cached = { at: Date.now(), value };
    return value;
  } catch (error) {
    // The header is furniture on every page, including the 404. It degrades to
    // its unnumbered form rather than taking a route down with the index.
    console.error('Index pulse lookup failed.', {
      name: error instanceof Error ? error.name : 'ProviderError',
    });
    // A dynamic route must not make every request wait through the same outage.
    cached = { at: Date.now(), value: null };
    return null;
  }
});

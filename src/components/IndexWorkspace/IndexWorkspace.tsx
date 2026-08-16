'use client';

import { createNullCache } from '@algolia/client-common';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { useMemo } from 'react';
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  usePagination,
  useStats,
} from 'react-instantsearch';
import aa from 'search-insights';
import 'instantsearch.css/themes/reset.css';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import { normalizeFactSearchHit } from '@/lib/noteContent';
import { createSearchRouting } from '@/lib/searchRouting';
import type { FactHitRecord, SendEventForHits } from '@/types/algolia';
import { getSearchUserToken } from '@/utils/userToken';
import IndexSearch from './IndexSearch';
import IndexSidebar from './IndexSidebar';
import ResultQueue from './ResultQueue';
import styles from './IndexWorkspace.module.css';

const hasCredentials = hasValidAlgoliaCredentials();
const isDevelopment = process.env.NODE_ENV === 'development';
const SEARCH_DEADLINE_MS = 5_000;
const algoliaClient = hasCredentials
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, {
      ...(isDevelopment
        ? { responsesCache: createNullCache(), requestsCache: createNullCache() }
        : {}),
    })
  : null;
const searchClient = algoliaClient ? withSearchDeadline(algoliaClient) : null;

function withSearchDeadline(client: ReturnType<typeof algoliasearch>) {
  return {
    ...client,
    async search(...args: Parameters<typeof client.search>) {
      let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
      const deadline = new Promise<never>((_, reject) => {
        timeout = globalThis.setTimeout(
          () => reject(new Error('Search request exceeded its response deadline.')),
          SEARCH_DEADLINE_MS
        );
      });
      try {
        const response = await Promise.race([client.search(...args), deadline]);
        return {
          ...response,
          results: response.results.map((result) => {
            if (!('hits' in result) || !Array.isArray(result.hits)) return result;
            return { ...result, hits: result.hits.map(withoutHighlightMetadata) };
          }),
        };
      } finally {
        if (timeout) globalThis.clearTimeout(timeout);
      }
    },
  };
}

function withoutHighlightMetadata(hit: unknown): unknown {
  if (!hit || typeof hit !== 'object') return hit;
  const safeHit = { ...(hit as Record<string, unknown>) };
  delete safeHit['_highlightResult'];
  delete safeHit['_snippetResult'];
  return safeHit;
}

if (hasCredentials) {
  const userToken = getSearchUserToken();
  if (userToken) aa('setUserToken', userToken);
}

export default function IndexWorkspace() {
  const routing = useMemo(() => createSearchRouting(ALGOLIA_INDEX_NAME), []);

  if (!searchClient) {
    return (
      <div className={styles.unavailable} role="status">
        <p className={styles.sectionLabel}>Index unavailable</p>
        <h2>Search has gone quiet.</h2>
        <p>The project directory and About page are still available while the index reconnects.</p>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
        routing={routing}
        insights={{ insightsClient: aa }}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={5} clickAnalytics />
        <IndexSidebar />
        <div className={styles.readingPane}>
          <IndexSearch />
          <SearchResults />
        </div>
      </InstantSearch>
    </div>
  );
}

function SearchResults() {
  const { items, sendEvent } = useHits<FactHitRecord>();
  const { indexUiState, status } = useInstantSearch({ catchError: true });
  const { nbHits } = useStats();
  const resultKey = JSON.stringify({
    indexUiState,
    objectIDs: items.map((item) => item.objectID),
  });
  const readableItems = useMemo(
    () => items.map(normalizeFactSearchHit).filter((item) => item !== null),
    [items]
  );

  if (readableItems.length === 0) {
    if (items.length > 0) return <UnreadableResults />;
    if (status === 'error') return <SearchFailure />;
    if (status !== 'idle') return <SearchStatus />;
    return (
      <div className={styles.emptyState}>
        <span aria-hidden="true">00</span>
        <h2>No notes match that.</h2>
        <p>Broaden the query or clear a filter. The index is literal, not psychic.</p>
      </div>
    );
  }

  return (
    <div className={styles.resultArea}>
      <SearchStatus />
      {items.length !== readableItems.length ? <PartialResultsWarning /> : null}
      <ResultQueue
        items={readableItems}
        nbHits={nbHits}
        resultKey={resultKey}
        sendEvent={sendEvent as SendEventForHits}
      />
      <IndexPagination />
    </div>
  );
}

function PartialResultsWarning() {
  return (
    <p className={styles.resultWarning} role="alert">
      Some malformed notes were withheld. The readable results remain available.
    </p>
  );
}

function UnreadableResults() {
  return (
    <div className={styles.emptyState} role="alert">
      <span aria-hidden="true">INVALID</span>
      <h2>The index returned unreadable notes.</h2>
      <p>The malformed records were withheld instead of crashing the page.</p>
    </div>
  );
}

function SearchFailure() {
  return (
    <div className={styles.failureState} role="alert">
      <strong>Search is offline.</strong>
      <span>Everything else works.</span>
    </div>
  );
}

function SearchStatus() {
  const { status } = useInstantSearch();
  if (status === 'error') {
    return (
      <p className={styles.searchStatus} role="alert">
        Search connection failed. Showing the last available results.
      </p>
    );
  }
  if (status !== 'loading' && status !== 'stalled') return null;
  return (
    <p className={styles.searchStatus} role="status">
      Searching…
    </p>
  );
}

function IndexPagination() {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine } = usePagination({
    padding: 1,
  });

  if (nbPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Notes pagination">
      <button
        type="button"
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
        aria-label="Previous page"
      >
        ←
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => refine(page)}
          aria-current={page === currentRefinement ? 'page' : undefined}
          aria-label={`Page ${page + 1}`}
        >
          {String(page + 1).padStart(2, '0')}
        </button>
      ))}
      <button
        type="button"
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}

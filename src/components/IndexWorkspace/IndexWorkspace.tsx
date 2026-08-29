'use client';

import { createNullCache } from '@algolia/client-common';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { useCallback, useMemo, useState } from 'react';
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from 'react-instantsearch';
import aa from 'search-insights';
import 'instantsearch.css/themes/reset.css';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import { normalizeFactSearchHit } from '@/lib/noteContent';
import { createSearchRouting } from '@/lib/searchRouting';
import type { FactHitRecord } from '@/types/algolia';
import { getSearchUserToken } from '@/utils/userToken';
import IndexSearch from './IndexSearch';
import IndexSidebar from './IndexSidebar';
import ResultQueue from './ResultQueue';
import styles from './IndexWorkspace.module.css';

const hasCredentials = hasValidAlgoliaCredentials();
const isDevelopment = process.env.NODE_ENV === 'development';
const SEARCH_DEADLINE_MS = 5_000;
const MAX_BOARD_NOTES = 500;
// Caching is disabled in development so an edited record shows up on reload
// rather than being served from the previous session's response cache.
const clientOptions = isDevelopment
  ? { responsesCache: createNullCache(), requestsCache: createNullCache() }
  : {};
const algoliaClient = hasCredentials
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, clientOptions)
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
      <output className={styles.unavailable}>
        <p className={styles.sectionLabel}>Index unavailable</p>
        <h2>Search has gone quiet.</h2>
        <p>The project directory and About page are still available while the index reconnects.</p>
      </output>
    );
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={ALGOLIA_INDEX_NAME}
      routing={routing}
      insights={{ insightsClient: aa }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={MAX_BOARD_NOTES} clickAnalytics />
      <IndexExperience />
    </InstantSearch>
  );
}

function IndexExperience() {
  const { items, sendEvent } = useHits<FactHitRecord>();
  const { status } = useInstantSearch({ catchError: true });
  const readableItems = useMemo(() => {
    const seenIds = new Set<string>();
    return items.flatMap((item) => {
      const readableItem = normalizeFactSearchHit(item);
      if (!readableItem || seenIds.has(readableItem.objectID)) return [];
      seenIds.add(readableItem.objectID);
      return [readableItem];
    });
  }, [items]);
  const rankedItems = useMemo(() => readableItems.slice(0, MAX_BOARD_NOTES), [readableItems]);
  const { query } = useSearchBox();
  // The selection carries the query it was made under, so a new search discards
  // it by derivation rather than by resetting state in an effect. Otherwise the
  // pane keeps showing a note left over from the previous query while the board
  // underneath it has already moved on.
  const [selection, setSelection] = useState<{ id: string; query: string } | null>(null);

  // Selection lives in the workspace, not the URL. The board is a reading
  // surface: picking a note swaps the pane and reports the click to Algolia,
  // and it falls back to the top-ranked note whenever the current pick is stale
  // or has dropped out of the results.
  const selectedId = useMemo(() => {
    const stillValid =
      selection?.query === query && rankedItems.some((item) => item.objectID === selection?.id);
    return stillValid ? selection?.id : rankedItems[0]?.objectID;
  }, [rankedItems, selection, query]);
  const selectNote = useCallback(
    (id: string) => {
      const hit = rankedItems.find((item) => item.objectID === id);
      if (!hit) return;
      sendEvent('click', hit, 'Note Selected');
      setSelection({ id, query });
    },
    [rankedItems, sendEvent, query]
  );

  return (
    <div className={styles.workspace}>
      <IndexSidebar items={rankedItems} selectedId={selectedId} onSelect={selectNote} />
      <div className={styles.readingPane}>
        <IndexSearch />
        <SearchResults
          rawItemCount={items.length}
          items={rankedItems}
          status={status}
          readableItemCount={readableItems.length}
          selectedId={selectedId}
          onSelect={selectNote}
        />
      </div>
    </div>
  );
}

interface SearchResultsProps {
  rawItemCount: number;
  readableItemCount: number;
  items: NonNullable<ReturnType<typeof normalizeFactSearchHit>>[];
  status: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}

function SearchResults({
  rawItemCount,
  readableItemCount,
  items,
  status,
  selectedId,
  onSelect,
}: Readonly<SearchResultsProps>) {
  if (items.length === 0) {
    if (rawItemCount > 0) return <UnreadableResults />;
    if (status === 'error') return <SearchFailure />;
    if (status !== 'idle') return <SearchStatus status={status} />;
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
      <SearchStatus status={status} />
      {rawItemCount !== readableItemCount ? <PartialResultsWarning /> : null}
      <ResultQueue items={items} selectedId={selectedId} onSelect={onSelect} />
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

function SearchStatus({ status }: Readonly<{ status: string }>) {
  if (status === 'error') {
    return (
      <p className={styles.searchStatus} role="alert">
        Search connection failed. Showing the last available results.
      </p>
    );
  }
  if (status !== 'loading' && status !== 'stalled') return null;
  return <output className={styles.searchStatus}>Searching…</output>;
}

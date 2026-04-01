'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import type { FactHitRecord } from '@/types/algolia';

export type { FactHitRecord as OverlayHit };

/**
 * Hook to handle factId deep-linking.
 * When factId is in the URL (direct navigation / shared link), fetches the
 * card from Algolia and returns it for a standalone overlay.
 * Filters are NOT modified — the overlay is independent of search state.
 */
export function useFactIdRouting(indexName: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const factId = searchParams?.get('factId') ?? null;
  const [fetchedHit, setFetchedHit] = useState<{ id: string; hit: FactHitRecord } | null>(null);

  // Derive overlayHit: only show when factId matches what we fetched
  const overlayHit = factId && fetchedHit?.id === factId ? fetchedHit.hit : null;

  useEffect(() => {
    if (!factId) return;

    // FactCard manages only local state and does not write factId to the URL.
    // If we're here, factId came from the URL (initial load, router navigation, or history navigation).
    let cancelled = false;

    fetchFactById(factId, indexName)
      .then((data) => {
        if (!cancelled && data) {
          setFetchedHit({ id: factId, hit: data });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Error loading deep-linked fact card:', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [factId, indexName]);

  const closeOverlay = useCallback(() => {
    setFetchedHit(null);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('factId');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [router, pathname, searchParams]);

  return { factId, overlayHit, closeOverlay };
}

/** Validates that a factId contains only safe characters for use in an Algolia filter. */
function isValidFactId(id: string): boolean {
  return /^[a-zA-Z0-9_:\-]{1,200}$/.test(id);
}

/**
 * Fetch a single fact card from Algolia by objectID.
 * Returns all fields needed to render the overlay.
 */
export async function fetchFactById(
  factId: string,
  indexName: string
): Promise<FactHitRecord | null> {
  const appId = ALGOLIA_APP_ID;
  const apiKey = ALGOLIA_SEARCH_KEY;
  if (!appId || !apiKey || !hasValidAlgoliaCredentials(appId, apiKey)) {
    console.warn('Algolia credentials not available');
    return null;
  }

  if (!isValidFactId(factId)) {
    console.error('Invalid factId — rejected before Algolia filter:', factId);
    return null;
  }

  try {
    const client = algoliasearch(appId, apiKey);
    const { results } = await client.search({
      requests: [
        {
          indexName,
          query: '',
          filters: `objectID:"${factId}"`,
          hitsPerPage: 1,
          attributesToRetrieve: [
            'objectID',
            'title',
            'blurb',
            'fact',
            'content',
            'category',
            'projects',
            'tags.lvl0',
            'tags.lvl1',
            'signal',
            'url',
          ],
        },
      ],
    });

    const firstResult = results[0];
    if ('hits' in firstResult && firstResult.hits.length > 0) {
      return firstResult.hits[0] as FactHitRecord;
    }

    return null;
  } catch (error) {
    console.error('Error fetching fact by ID:', error);
    return null;
  }
}

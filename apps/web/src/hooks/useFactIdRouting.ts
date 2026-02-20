'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { hasValidAlgoliaCredentials } from '@/lib/algolia';

export interface OverlayHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  content?: string;
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  projects: string[];
  category: string;
  signal: number;
  url?: string;
}

/**
 * Hook to handle factId deep-linking.
 * When factId is in the URL (direct navigation / shared link), fetches the
 * card from Algolia and returns it for a standalone overlay.
 * Filters are NOT modified — the overlay is independent of search state.
 */
export function useFactIdRouting(indexName: string) {
  const searchParams = useSearchParams();
  const factId = searchParams?.get('factId') ?? null;
  const [fetchedHit, setFetchedHit] = useState<{ id: string; hit: OverlayHit } | null>(null);

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
    const params = new URLSearchParams(window.location.search);
    params.delete('factId');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);
  }, []);

  return { factId, overlayHit, closeOverlay };
}

/**
 * Fetch a single fact card from Algolia by objectID.
 * Returns all fields needed to render the overlay.
 */
export async function fetchFactById(factId: string, indexName: string): Promise<OverlayHit | null> {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
  if (!appId || !apiKey || !hasValidAlgoliaCredentials(appId, apiKey)) {
    console.warn('Algolia credentials not available');
    return null;
  }

  try {
    const client = algoliasearch(appId, apiKey);
    const { results } = await client.search({
      requests: [
        {
          indexName,
          query: '',
          filters: `objectID:${factId}`,
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
      return firstResult.hits[0] as OverlayHit;
    }

    return null;
  } catch (error) {
    console.warn('Error fetching fact by ID:', error);
    return null;
  }
}

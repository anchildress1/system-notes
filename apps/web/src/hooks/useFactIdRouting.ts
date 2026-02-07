'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';

interface FactMetadata {
  objectID: string;
  category?: string;
  projects?: string[];
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
}

/**
 * Hook to handle factId in URL and scroll card into view when rendered
 * Optimized for performance to maintain Lighthouse scores
 */
export function useFactIdRouting(indexName: string) {
  const searchParams = useSearchParams();
  const factId = searchParams?.get('factId') ?? null;
  const scrollAttempted = useRef(false);
  const fallbackSearchApplied = useRef(false);

  useEffect(() => {
    if (!factId) {
      scrollAttempted.current = false;
      fallbackSearchApplied.current = false;
      return;
    }

    const scrollToCard = () => {
      if (scrollAttempted.current) return;

      const cardLink = document.querySelector(`[href*="factId=${encodeURIComponent(factId)}"]`);
      if (cardLink && typeof (cardLink as HTMLElement).scrollIntoView === 'function') {
        scrollAttempted.current = true;

        // Use requestAnimationFrame for smooth, performant scrolling
        requestAnimationFrame(() => {
          cardLink.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          // Add subtle focus indicator without forcing browser focus
          // This doesn't trigger layout shift or reflow
          const article = cardLink.querySelector('article');
          if (article) {
            article.setAttribute('data-highlighted', 'true');
            setTimeout(() => {
              article.removeAttribute('data-highlighted');
            }, 2000);
          }
        });
      }
    };

    // Initial attempt - quick check if card is already rendered
    scrollToCard();

    // Set up MutationObserver to detect when card is added to DOM
    // This is more efficient than polling setInterval
    const observer = new MutationObserver(() => {
      scrollToCard();
      if (scrollAttempted.current) {
        observer.disconnect();
      }
    });

    // Observe the results container for new cards
    const resultsContainer = document.querySelector('[aria-label="Search results"]');
    if (resultsContainer) {
      observer.observe(resultsContainer, {
        childList: true,
        subtree: true,
      });
    }

    const hasFilterParams = () => {
      if (!searchParams) return false;
      return (
        searchParams.get('category') ||
        searchParams.get('project') ||
        searchParams.get('tag0') ||
        searchParams.get('tag1') ||
        searchParams.get('query')
      );
    };

    const applyMetadataFilters = async () => {
      if (fallbackSearchApplied.current || hasFilterParams()) return;
      fallbackSearchApplied.current = true;

      try {
        const metadata = await fetchFactMetadata(factId, indexName);
        if (!metadata) return;

        const params = new URLSearchParams(window.location.search);
        params.set('factId', factId);

        if (!params.has('category') && metadata.category) {
          params.append('category', metadata.category);
        }

        if (!params.has('project') && metadata.projects?.length) {
          metadata.projects.forEach((project) => params.append('project', project));
        }

        if (!params.has('tag0') && metadata['tags.lvl0']?.length) {
          metadata['tags.lvl0'].forEach((tag) => params.append('tag0', tag));
        }

        if (!params.has('tag1') && metadata['tags.lvl1']?.length) {
          metadata['tags.lvl1'].forEach((tag) => params.append('tag1', tag));
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (error) {
        console.error('Error applying fallback filters:', error);
      }
    };

    void applyMetadataFilters();

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [factId, indexName, searchParams]);

  return { factId };
}

/**
 * Fetch fact metadata from Algolia to enable smart filtering
 * This is used when arriving at a URL with factId but no matching results
 */
export async function fetchFactMetadata(
  factId: string,
  indexName: string
): Promise<FactMetadata | null> {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
  if (!appId || !apiKey) {
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
          attributesToRetrieve: ['objectID', 'category', 'projects', 'tags.lvl0', 'tags.lvl1'],
        },
      ],
    });

    const firstResult = results[0];
    if ('hits' in firstResult && firstResult.hits.length > 0) {
      return firstResult.hits[0] as FactMetadata;
    }

    return null;
  } catch (error) {
    console.error('Error fetching fact metadata:', error);
    return null;
  }
}

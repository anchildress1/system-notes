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

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

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

    // Use requestIdleCallback for non-critical work to avoid blocking main thread
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    const scrollToCard = () => {
      if (scrollAttempted.current) return;

      const cardLink = document.querySelector(`[href*="factId=${encodeURIComponent(factId)}"]`);
      if (cardLink) {
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
      idleCallback(() => {
        scrollToCard();
        if (scrollAttempted.current) {
          observer.disconnect();
        }
      });
    });

    // Observe the results container for new cards
    const resultsContainer = document.querySelector('[aria-label="Search results"]');
    if (resultsContainer) {
      observer.observe(resultsContainer, {
        childList: true,
        subtree: true,
      });
    }

    // Fallback: If card not found after 3 seconds, fetch metadata and apply smart search
    const fallbackTimeout = setTimeout(async () => {
      if (!scrollAttempted.current && !fallbackSearchApplied.current) {
        fallbackSearchApplied.current = true;

        try {
          const metadata = await fetchFactMetadata(factId, indexName);
          if (metadata) {
            // Update URL to include objectID in query to force the card to appear
            const params = new URLSearchParams(window.location.search);
            const currentQuery = params.get('query') || '';

            // Only update query if it doesn't already contain the objectID
            if (!currentQuery.includes(factId)) {
              // Use objectID search to ensure card appears
              params.set('query', factId);
              const newUrl = `${window.location.pathname}?${params.toString()}`;
              window.history.replaceState({}, '', newUrl);

              // Trigger a custom event to notify InstantSearch to update
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }
        } catch (error) {
          console.error('Error applying fallback search:', error);
        }
      }
    }, 3000);

    // Cleanup
    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [factId, indexName]);

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

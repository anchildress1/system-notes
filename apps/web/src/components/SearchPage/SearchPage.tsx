'use client';

import { useMemo, useEffect } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';
import {
  InstantSearch,
  RefinementList,
  Stats,
  ClearRefinements,
  Configure,
} from 'react-instantsearch';
import { SiAlgolia } from 'react-icons/si';
import styles from './SearchPage.module.css';
import UnifiedHitCard from './UnifiedHitCard';
import GroupedTagFilter from './GroupedTagFilter';
import InfiniteHits from './InfiniteHits';
import LoadingIndicator from './LoadingIndicator';
import { createSearchRouting } from './searchRouting';
import { getSearchSessionId } from '@/utils/userToken';
import { ALGOLIA_INDEX } from '@/config';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

const hasCredentials = appId && searchKey;
const searchClient = hasCredentials ? algoliasearch(appId, searchKey) : null;

const insightsConfig = {
  insightsClient: aa,
  insightsInitParams: {
    appId,
    apiKey: searchKey,
    useCookie: true,
  },
};

declare global {
  interface Window {
    SiteSearch?: {
      init: (config: unknown) => void;
    };
    SiteSearchWithAI?: {
      init: (config: unknown) => void;
    };
    sitesearch?: {
      init: (config: unknown) => void;
    };
    AlgoliaSiteSearch?: {
      init: (config: unknown) => void;
    };
  }
}

function useSiteSearchWithAI(appId: string, apiKey: string, indexName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadWidget = () => {
      // Load CSS
      if (!document.querySelector('link[href*="search.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/@algolia/sitesearch@1.0.11/dist/search.min.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!document.querySelector('script[src*="search.min.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@algolia/sitesearch@1.0.11/dist/search.min.js';
        script.async = true;
        script.onload = initWidget;
        document.body.appendChild(script);
      } else {
        initWidget();
      }
    };

    const initWidget = () => {
      // Check for available globals - SiteSearch is the standard for @algolia/sitesearch
      const candidates = [
        'SiteSearch',
        'sitesearch',
        'SiteSearchWithAI',
        'AlgoliaSiteSearch',
      ] as const;
      const globalName = candidates.find((c) => window[c]);

      if (globalName && window[globalName]) {
        window[globalName]?.init({
          container: '#sitesearch',
          applicationId: appId,
          apiKey: apiKey,
          indexName: indexName,
          assistantId: 'XcsWYxeCArfQ',
          attributes: {
            primaryText: 'title',
            secondaryText: 'blurb',
            image: 'undefined',
          },
        });
      }
    };

    loadWidget();
  }, [appId, apiKey, indexName]);
}

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);
  const isEnabled = hasCredentials;

  useSiteSearchWithAI(appId, searchKey, indexName);

  if (!isEnabled || !searchClient) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>
            Search is currently unavailable. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        insights={insightsConfig}
        routing={routing}
      >
        <Configure
          hitsPerPage={20}
          attributesToHighlight={['title', 'blurb', 'fact']}
          clickAnalytics
          analytics
          userToken={getSearchSessionId()}
        />

        <div className={styles.searchSection}>
          <div id="sitesearch" className={styles.siteSearchContainer} data-testid="sitesearch" />

          <div className={styles.metaRow}>
            <Stats
              classNames={{ root: styles.statsRoot }}
              translations={{
                rootElementText({ nbHits, processingTimeMS }) {
                  return `${nbHits.toLocaleString()} results in ${processingTimeMS}ms`;
                },
              }}
            />
            <a
              href="https://www.algolia.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.algoliaAttribution}
              aria-label="Powered by Algolia"
            >
              <SiAlgolia aria-hidden="true" className={styles.algoliaIcon} />
              <span className={styles.algoliaText}>Powered by Algolia</span>
            </a>
          </div>
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <div className={styles.refinementGroup}>
                <h2 className={styles.refinementTitle}>Category</h2>
                <RefinementList
                  attribute="category"
                  classNames={{
                    root: styles.refinementRoot,
                    list: styles.refinementList,
                    item: styles.refinementItem,
                    selectedItem: styles.refinementItemSelected,
                    label: styles.refinementLabel,
                    checkbox: styles.refinementCheckbox,
                    labelText: styles.refinementLabelText,
                    count: styles.refinementCount,
                  }}
                />
              </div>

              <div className={styles.refinementGroup}>
                <h2 className={styles.refinementTitle}>Builds</h2>
                <RefinementList
                  attribute="projects"
                  classNames={{
                    root: styles.refinementRoot,
                    list: styles.refinementList,
                    item: styles.refinementItem,
                    selectedItem: styles.refinementItemSelected,
                    label: styles.refinementLabel,
                    checkbox: styles.refinementCheckbox,
                    labelText: styles.refinementLabelText,
                    count: styles.refinementCount,
                  }}
                />
              </div>

              <div className={styles.refinementGroup}>
                <h2 className={styles.refinementTitle}>Tags</h2>
                <GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />
              </div>

              <ClearRefinements
                classNames={{
                  root: styles.clearRoot,
                  button: styles.clearButton,
                  disabledButton: styles.clearButtonDisabled,
                }}
                translations={{
                  resetButtonText: 'Clear Filters',
                }}
              />
            </div>
          </aside>

          <section className={styles.results} aria-label="Search results">
            <LoadingIndicator />
            <InfiniteHits
              hitComponent={
                UnifiedHitCard as React.ComponentType<{
                  hit: import('instantsearch.js').Hit;
                  sendEvent?: import('@/types/algolia').SendEventForHits;
                }>
              }
              classNames={{
                root: styles.hitsRoot,
                list: styles.hitsList,
                item: styles.hitsItem,
              }}
            />
          </section>
        </div>
      </InstantSearch>
    </div>
  );
}

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
import { ErrorBoundary } from '../ErrorBoundary';
import { ALGOLIA_INDEX } from '@/config';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
// Use constant for index name
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

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);

  const isEnabled = hasCredentials && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID;

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@algolia/sitesearch@latest/dist/search-askai.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@algolia/sitesearch@latest/dist/search-askai.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error SiteSearchAskAI is not typed on window
      if (window.SiteSearchAskAI) {
        // @ts-expect-error SiteSearchAskAI is not typed on window
        window.SiteSearchAskAI.init({
          container: '#search-container',
          applicationId: appId,
          apiKey: searchKey,
          indexName: indexName,
          assistantId: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID,
          attributes: {
            primaryText: 'title',
            secondaryText: 'blurb',
            tertiaryText: 'fact',
            url: 'url',
          },
          searchParameters: {
            clickAnalytics: true,
            analytics: true,
            userToken: getSearchSessionId(),
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // Accessibility fix: Inject aria-labels into Algolia's Autocomplete elements
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fixAccessibility = () => {
      // 1. Fix Input Label
      const input = document.querySelector('.aa-Input');
      if (input && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Search facts and system notes');
      }

      // 2. Fix Clear Button
      const clearBtn = document.querySelector('.aa-ClearButton');
      if (clearBtn && !clearBtn.getAttribute('aria-label')) {
        clearBtn.setAttribute('aria-label', 'Clear search query');
      }

      // 3. Fix Submit Button
      const submitBtn = document.querySelector('.aa-SubmitButton');
      if (submitBtn && !submitBtn.getAttribute('aria-label')) {
        submitBtn.setAttribute('aria-label', 'Submit search');
      }

      // 4. Fix Panel/Dropdown accessibility
      const panel = document.querySelector('.aa-Panel');
      if (panel) {
        if (!panel.getAttribute('role')) panel.setAttribute('role', 'listbox');
        if (!panel.getAttribute('aria-label'))
          panel.setAttribute('aria-label', 'Search predictions');
      }
    };

    // Run immediately in case elements are already present
    fixAccessibility();

    const observer = new MutationObserver(fixAccessibility);

    // Observe the document body for changes (since the portal/dropdown might be appended anywhere)
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const unavailableUI = (
    <div className={styles.container}>
      <div className={styles.errorState}>
        <p className={styles.errorMessage}>
          Search is currently unavailable. Please check back later.
        </p>
      </div>
    </div>
  );

  if (!isEnabled || !searchClient) {
    return unavailableUI;
  }

  return (
    <div className={styles.container}>
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        insights={insightsConfig}
        routing={routing}
      >
        <Configure hitsPerPage={20} attributesToHighlight={['title', 'blurb', 'fact']} />

        <header className={styles.searchHeader}>
          <ErrorBoundary fallback={null}>
            <div id="search-container" data-testid="search-container" />
          </ErrorBoundary>

          <div className={styles.metaRow}>
            <Stats
              classNames={{
                root: styles.statsRoot,
              }}
              translations={{
                rootElementText({ nbHits, processingTimeMS }) {
                  return `${nbHits.toLocaleString()} results found in ${processingTimeMS / 1000}s`;
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
        </header>

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              hitComponent={UnifiedHitCard as any}
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

'use client';

import { useMemo, useEffect } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';
import {
  InstantSearch,
  SearchBox,
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

const SITESEARCH_VERSION = '1.0.0';
const SITESEARCH_CSS = `https://unpkg.com/@algolia/sitesearch@${SITESEARCH_VERSION}/dist/search-ai.min.css`;
const SITESEARCH_JS = `https://unpkg.com/@algolia/sitesearch@${SITESEARCH_VERSION}/dist/search-ai.min.js`;

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

function useSiteSearchWidget() {
  useEffect(() => {
    const assistantId = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID;
    if (!hasCredentials || !assistantId) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SITESEARCH_CSS;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = SITESEARCH_JS;
    script.async = true;
    script.onload = () => {
      // @ts-expect-error SiteSearchWithAI is injected by external script
      if (window.SiteSearchWithAI) {
        // @ts-expect-error SiteSearchWithAI is injected by external script
        window.SiteSearchWithAI.init({
          container: '#sitesearch',
          applicationId: appId,
          apiKey: searchKey,
          indexName,
          assistantId,
          attributes: {
            primaryText: 'title',
            secondaryText: 'blurb',
            image: 'undefined',
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);
}

function useAccessibilityFixes() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fixAccessibility = () => {
      const input = document.querySelector('.aa-Input');
      if (input && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Search facts and system notes');
      }

      const clearBtn = document.querySelector('.aa-ClearButton');
      if (clearBtn && !clearBtn.getAttribute('aria-label')) {
        clearBtn.setAttribute('aria-label', 'Clear search query');
      }

      const submitBtn = document.querySelector('.aa-SubmitButton');
      if (submitBtn && !submitBtn.getAttribute('aria-label')) {
        submitBtn.setAttribute('aria-label', 'Submit search');
      }

      const panel = document.querySelector('.aa-Panel');
      if (panel) {
        if (!panel.getAttribute('role')) panel.setAttribute('role', 'listbox');
        if (!panel.getAttribute('aria-label'))
          panel.setAttribute('aria-label', 'Search predictions');
      }
    };

    fixAccessibility();
    const observer = new MutationObserver(fixAccessibility);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);
  const isEnabled = hasCredentials && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID;

  useSiteSearchWidget();
  useAccessibilityFixes();

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
      <ErrorBoundary fallback={null}>
        <div id="sitesearch" data-testid="search-container" className={styles.siteSearchWidget} />
      </ErrorBoundary>

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

        <SearchBox
          classNames={{
            root: styles.searchBoxRoot,
            form: styles.searchBoxForm,
            input: styles.searchBoxInput,
            submit: styles.searchBoxSubmit,
            reset: styles.searchBoxReset,
            submitIcon: styles.searchBoxIcon,
            resetIcon: styles.searchBoxIcon,
          }}
          placeholder="Search facts and system notes..."
        />

        <header className={styles.searchHeader}>
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

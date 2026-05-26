'use client';

import { useMemo, useState, useCallback, useEffect, Suspense } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import {
  InstantSearch,
  RefinementList,
  Stats,
  ClearRefinements,
  Configure,
} from 'react-instantsearch';
import aa from 'search-insights';
import { SiAlgolia } from 'react-icons/si';
import { FiPlus, FiMinus, FiSliders } from 'react-icons/fi';
import 'instantsearch.css/themes/reset.css';
import styles from './SearchPage.module.css';
import FactCard from '../FactCard/FactCard';
import InfiniteHits from './InfiniteHits';
import LoadingIndicator from './LoadingIndicator';
import { createSearchRouting } from './searchRouting';
import { ALGOLIA_INDEX } from '@/config';
import { useFactIdRouting } from '@/hooks/useFactIdRouting';
import FactCardOverlay from '../FactCard/FactCardOverlay';
import { getChatSessionId } from '@/utils/userToken';
import {
  ALGOLIA_APP_ID,
  ALGOLIA_SEARCH_KEY,
  ALGOLIA_AI_ID,
  hasValidAlgoliaCredentials,
} from '@/lib/algolia';

const appId = ALGOLIA_APP_ID;
const searchKey = ALGOLIA_SEARCH_KEY;
const searchAiId = ALGOLIA_AI_ID;
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

const hasCredentials = hasValidAlgoliaCredentials();
const searchClient = hasCredentials ? algoliasearch(appId, searchKey) : null;

// Use the same userToken for both search requests and Insights events so that
// queryID returned in search results can be correlated to click events.
aa('setUserToken', getChatSessionId());

declare global {
  var SiteSearchAskAI: { init: (config: unknown) => void } | undefined;
  var SiteSearch: { init: (config: unknown) => void } | undefined;
  var sitesearch: { init: (config: unknown) => void } | undefined;
  var AlgoliaSiteSearch: { init: (config: unknown) => void } | undefined;
}

function useSiteSearchWithAI(
  appId: string,
  apiKey: string,
  indexName: string,
  searchAiId: string,
  enabled: boolean
) {
  const initRef = useCallback(() => {
    if (!document.querySelector('#search-askai')) return;

    const candidates = [
      'SiteSearchAskAI',
      'SiteSearch',
      'sitesearch',
      'AlgoliaSiteSearch',
    ] as const;
    const globalName = candidates.find((c) => globalThis[c]);
    if (!globalName) return;

    try {
      globalThis[globalName]?.init({
        container: '#search-askai',
        applicationId: appId,
        apiKey,
        indexName,
        assistantId: searchAiId,
        insights: true,
        suggestedQuestionsEnabled: false,
        attributes: {
          primaryText: 'title',
          secondaryText: 'blurb',
          tertiaryText: 'tags.lvl1',
          image: undefined,
        },
      });
    } catch (e) {
      console.error('[SiteSearch] Failed to init:', e);
    }
  }, [appId, apiKey, indexName, searchAiId]);

  useEffect(() => {
    if (!enabled) return;
    import('@algolia/sitesearch/dist/search-askai.min.css');
    import('@algolia/sitesearch/dist/search-askai.min.js')
      .then(initRef)
      .catch((err) => console.error('[SiteSearch] Failed to load:', err));
  }, [enabled, initRef]);
}

const refinementClassNames = {
  root: styles.refinementRoot,
  list: styles.refinementList,
  item: styles.refinementItem,
  selectedItem: styles.refinementItemSelected,
  label: styles.refinementLabel,
  checkbox: styles.refinementCheckbox,
  labelText: styles.refinementLabelText,
  count: styles.refinementCount,
};

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);
  const isEnabled = Boolean(hasCredentials);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleFilters = useCallback(() => setShowFilters((prev) => !prev), []);

  useSiteSearchWithAI(appId, searchKey, indexName, searchAiId, isEnabled);

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
        insights={{ insightsClient: aa }}
        routing={routing}
      >
        <Configure
          hitsPerPage={20}
          attributesToHighlight={['title', 'blurb', 'fact']}
          clickAnalytics
        />

        <div className={styles.searchSection}>
          <div id="search-askai" className={styles.siteSearchContainer} data-testid="sitesearch" />
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
              className="algolia-attribution"
              aria-label="Powered by Algolia"
            >
              <span className="algolia-hoverable">
                <SiAlgolia aria-hidden="true" className="algolia-icon" />
                <span className="algolia-name">Algolia</span>
              </span>
              <span className="algolia-prefix">Powered by</span>
            </a>
          </div>
        </div>

        <div className={styles.layout}>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={toggleFilters}
            aria-expanded={showFilters}
            aria-controls="search-sidebar"
          >
            <FiSliders size={16} aria-hidden="true" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>

          <aside
            id="search-sidebar"
            className={`${styles.sidebar} ${!showFilters ? styles.sidebarCollapsed : ''}`}
          >
            <div className={styles.filterSection}>
              <div className={styles.refinementGroup}>
                <button
                  type="button"
                  className={styles.refinementTitleToggle}
                  onClick={() => toggleSection('category')}
                  aria-expanded={!collapsedSections.category}
                  aria-controls="filter-category"
                >
                  <h2 className={styles.refinementTitle}>Category</h2>
                  {collapsedSections.category ? (
                    <FiPlus size={14} aria-hidden="true" />
                  ) : (
                    <FiMinus size={14} aria-hidden="true" />
                  )}
                </button>
                <div id="filter-category">
                  {!collapsedSections.category && (
                    <RefinementList attribute="category" classNames={refinementClassNames} />
                  )}
                </div>
              </div>

              <div className={styles.refinementGroup}>
                <button
                  type="button"
                  className={styles.refinementTitleToggle}
                  onClick={() => toggleSection('builds')}
                  aria-expanded={!collapsedSections.builds}
                  aria-controls="filter-builds"
                >
                  <h2 className={styles.refinementTitle}>Builds</h2>
                  {collapsedSections.builds ? (
                    <FiPlus size={14} aria-hidden="true" />
                  ) : (
                    <FiMinus size={14} aria-hidden="true" />
                  )}
                </button>
                <div id="filter-builds">
                  {!collapsedSections.builds && (
                    <RefinementList attribute="projects" classNames={refinementClassNames} />
                  )}
                </div>
              </div>

              <div className={styles.refinementGroup}>
                <button
                  type="button"
                  className={styles.refinementTitleToggle}
                  onClick={() => toggleSection('tags')}
                  aria-expanded={!collapsedSections.tags}
                  aria-controls="filter-tags"
                >
                  <h2 className={styles.refinementTitle}>Tags</h2>
                  {collapsedSections.tags ? (
                    <FiPlus size={14} aria-hidden="true" />
                  ) : (
                    <FiMinus size={14} aria-hidden="true" />
                  )}
                </button>
                <div id="filter-tags">
                  {!collapsedSections.tags && (
                    <RefinementList
                      attribute="tags.lvl1"
                      limit={50}
                      classNames={refinementClassNames}
                    />
                  )}
                </div>
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
                FactCard as React.ComponentType<{
                  hit: import('instantsearch.js').Hit;
                  sendEvent?: import('@/types/algolia').SendEventForHits;
                }>
              }
              classNames={{
                root: styles.hitsRoot,
                list: styles.hitsList,
                item: styles.hitsItem,
                empty: styles.hitsEmpty,
              }}
            />
          </section>
        </div>
      </InstantSearch>
      <Suspense fallback={null}>
        <FactIdOverlay indexName={indexName} />
      </Suspense>
    </div>
  );
}

function FactIdOverlay({ indexName }: { indexName: string }) {
  const { overlayHit, closeOverlay } = useFactIdRouting(indexName);
  return overlayHit ? <FactCardOverlay hit={overlayHit} onClose={closeOverlay} /> : null;
}

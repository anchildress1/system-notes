'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import {
  InstantSearch,
  RefinementList,
  Stats,
  ClearRefinements,
  Configure,
} from 'react-instantsearch';
import { SiAlgolia } from 'react-icons/si';
import { LuPlus, LuMinus } from 'react-icons/lu';
import styles from './SearchPage.module.css';
import UnifiedHitCard from './UnifiedHitCard';
import GroupedTagFilter from './GroupedTagFilter';
import InfiniteHits from './InfiniteHits';
import LoadingIndicator from './LoadingIndicator';
import { createSearchRouting } from './searchRouting';
import { ALGOLIA_INDEX } from '@/config';
import { useFactIdRouting } from '@/hooks/useFactIdRouting';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

// Algolia app IDs are always 10 alphanumeric chars, API keys are 32+ hex chars.
// Skip real SDK init when credentials are obviously fake (e.g. test_app_id)
// to prevent failed network requests that Chrome logs as console errors.
const hasCredentials = /^[A-Z0-9]{10}$/i.test(appId) && searchKey.length >= 20;
const searchClient = hasCredentials ? algoliasearch(appId, searchKey) : null;

declare global {
  interface Window {
    SiteSearchAskAI?: {
      init: (config: unknown) => void;
    };
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

function useSiteSearchWithAI(appId: string, apiKey: string, indexName: string, enabled: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const loadWidget = () => {
      // Load CSS
      if (!document.querySelector('link[href*="search-askai.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/@algolia/sitesearch@latest/dist/search-askai.min.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!document.querySelector('script[src*="search-askai.min.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@algolia/sitesearch@latest/dist/search-askai.min.js';
        script.async = true;
        script.onload = initWidget;
        document.body.appendChild(script);
      } else {
        // Script already loaded, init immediately (ensure DOM is ready)
        setTimeout(initWidget, 100);
      }
    };

    const initWidget = () => {
      // Ensure container exists
      if (!document.querySelector('#search-askai')) {
        console.warn('SiteSearch container not found, skipping init');
        return;
      }

      // Check for available globals
      const candidates = [
        'SiteSearchAskAI',
        'SiteSearch',
        'sitesearch',
        'AlgoliaSiteSearch',
      ] as const;
      const globalName = candidates.find((c) => window[c]);

      if (globalName && window[globalName]) {
        try {
          window[globalName]?.init({
            container: '#search-askai',
            applicationId: appId,
            apiKey: apiKey,
            indexName: indexName,
            assistantId: 'XcsWYxeCArfQ',
            insights: true,
            suggestedQuestionsEnabled: true,
            attributes: {
              primaryText: 'title',
              secondaryText: 'blurb',
              image: undefined,
            },
          });
        } catch (e) {
          console.warn('Failed to init SiteSearch:', e);
        }
      }
    };

    loadWidget();
  }, [appId, apiKey, indexName, enabled]);
}

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);
  const isEnabled = Boolean(hasCredentials);
  const router = useRouter();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  useSiteSearchWithAI(appId, searchKey, indexName, isEnabled);
  useFactIdRouting(indexName);

  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const link = e.currentTarget as HTMLElement;
      e.preventDefault();
      e.stopPropagation();

      const titleEl = link.querySelector('.ss-infinite-hits-item-title');
      const title = titleEl?.textContent?.trim();
      if (!title) return;

      const params = new URLSearchParams();
      params.set('query', title);

      router.push(`/search?${params.toString()}`, { scroll: false });

      setTimeout(() => {
        const dialog = document.querySelector('[role="dialog"], .modal-backdrop-askai');
        const closeBtn = dialog?.querySelector('button[aria-label*="lose"], button:has(svg)');
        if (closeBtn instanceof HTMLElement) closeBtn.click();

        setTimeout(() => {
          const firstCard = document.querySelector(
            '.FactCard-module__TivY_W__cardLink, .PostCard-module__card a'
          );
          if (firstCard instanceof HTMLElement) {
            firstCard.click();
          }
        }, 500);
      }, 100);
    };

    const attachHandlers = () => {
      const links = document.querySelectorAll('.ss-infinite-hits-anchor');
      links.forEach((link) => {
        if (!link.hasAttribute('data-has-handler')) {
          link.addEventListener('click', handleLinkClick);
          link.setAttribute('data-has-handler', 'true');
        }
      });
    };

    const observer = new MutationObserver(attachHandlers);
    observer.observe(document.body, { childList: true, subtree: true });
    attachHandlers();

    return () => observer.disconnect();
  }, [router]);

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
      <InstantSearch searchClient={searchClient} indexName={indexName} insights routing={routing}>
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
              className={styles.algoliaAttribution}
              aria-label="Powered by Algolia"
            >
              <span className={styles.algoliaHoverable}>
                <SiAlgolia aria-hidden="true" className={styles.algoliaIcon} />
                <span className={styles.algoliaName}>Algolia</span>
              </span>
              <span className={styles.algoliaPrefix}>Powered by</span>
            </a>
          </div>
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
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
                    <LuPlus size={14} aria-hidden="true" />
                  ) : (
                    <LuMinus size={14} aria-hidden="true" />
                  )}
                </button>
                {!collapsedSections.category && (
                  <div id="filter-category">
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
                )}
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
                    <LuPlus size={14} aria-hidden="true" />
                  ) : (
                    <LuMinus size={14} aria-hidden="true" />
                  )}
                </button>
                {!collapsedSections.builds && (
                  <div id="filter-builds">
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
                )}
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
                    <LuPlus size={14} aria-hidden="true" />
                  ) : (
                    <LuMinus size={14} aria-hidden="true" />
                  )}
                </button>
                {!collapsedSections.tags && (
                  <div id="filter-tags">
                    <GroupedTagFilter attributes={['tags.lvl0', 'tags.lvl1']} />
                  </div>
                )}
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

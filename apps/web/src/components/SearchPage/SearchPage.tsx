'use client';

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
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
import 'instantsearch.css/themes/satellite.css';
import styles from './SearchPage.module.css';
import UnifiedHitCard from './UnifiedHitCard';
import GroupedTagFilter from './GroupedTagFilter';
import InfiniteHits from './InfiniteHits';
import LoadingIndicator from './LoadingIndicator';
import { createSearchRouting } from './searchRouting';
import { ALGOLIA_INDEX } from '@/config';
import { useFactIdRouting } from '@/hooks/useFactIdRouting';
import { getChatSessionId } from '@/utils/userToken';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const searchAiId = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID || '';
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

// Algolia app IDs are always 10 alphanumeric chars, API keys are 32+ hex chars.
// Skip real SDK init when credentials are obviously fake (e.g. test_app_id)
// to prevent failed network requests that Chrome logs as console errors.
const hasCredentials = /^[A-Z0-9]{10}$/i.test(appId) && searchKey.length >= 20;
const searchClient = hasCredentials
  ? algoliasearch(appId, searchKey, {
      headers: {
        'X-Algolia-UserToken': getChatSessionId(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  : null;

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

function useSiteSearchWithAI(
  appId: string,
  apiKey: string,
  indexName: string,
  searchAiId: string,
  enabled: boolean
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // Dynamically import the widget from node_modules
    import('@algolia/sitesearch/dist/search-askai.min.css');
    import('@algolia/sitesearch/dist/search-askai.min.js')
      .then(() => {
        // Init immediately after load
        initWidget();
      })
      .catch((err) => console.error('Failed to load SiteSearch script:', err));

    const initWidget = () => {
      // Ensure container exists
      if (!document.querySelector('#search-askai')) {
        // Retry logic handled by caller re-mount or simple delay if needed
        return;
      }

      // Debug logging for credential passing
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.debug('[SiteSearch] Initializing with config:', {
          appId,
          apiKeyLength: apiKey?.length || 0,
          indexName,
          hostname: window.location.hostname,
        });
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
          const config = {
            container: '#search-askai',
            applicationId: appId,
            apiKey: apiKey,
            indexName: indexName,
            assistantId: searchAiId,
            insights: true,
            suggestedQuestionsEnabled: false,
            attributes: {
              primaryText: 'title',
              secondaryText: 'blurb',
              image: undefined,
            },
          };

          // Ensure all required fields are present
          if (!config.applicationId || !config.apiKey || !config.indexName) {
            console.error('[SiteSearch] Missing required credentials:', {
              hasAppId: Boolean(config.applicationId),
              hasApiKey: Boolean(config.apiKey),
              hasIndexName: Boolean(config.indexName),
            });
            return;
          }

          window[globalName]?.init(config);
        } catch (e) {
          console.error('[SiteSearch] Failed to init:', e);
        }
      } else {
        console.warn(
          '[SiteSearch] Global not found. Available:',
          Object.keys(window).filter(
            (k) => k.toLowerCase().includes('search') || k.toLowerCase().includes('algolia')
          )
        );
      }
    };
  }, [appId, apiKey, indexName, searchAiId, enabled]);
}

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);
  const isEnabled = Boolean(hasCredentials);
  const router = useRouter();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  useSiteSearchWithAI(appId, searchKey, indexName, searchAiId, isEnabled);
  useFactIdRouting(indexName);

  // Consolidated DOM observer for:
  // 1. Auto-focus chat input when Ask AI modal opens
  // 2. Attach click handlers to SiteSearch result links
  const pendingTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!isEnabled) return;

    const clearPendingTimeouts = () => {
      pendingTimeouts.current.forEach(clearTimeout);
      pendingTimeouts.current = [];
    };

    const scheduleTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        fn();
        pendingTimeouts.current = pendingTimeouts.current.filter((t) => t !== id);
      }, ms);
      pendingTimeouts.current.push(id);
    };

    const focusChatInput = () => {
      const selectors = [
        '.ss-chat-input',
        '.ss-search-input',
        'input[placeholder*="Ask"]',
        '.ss-searchbox input',
        '[role="dialog"] input[type="text"]',
        '.ss-modal input',
      ];

      for (const selector of selectors) {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input && document.contains(input)) {
          requestAnimationFrame(() => {
            input.focus();
            input.select();
          });
          break;
        }
      }
    };

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

      // Close the dialog and navigate to the first matching card.
      // Use tracked timeouts so they are cancelled on unmount.
      scheduleTimeout(() => {
        const dialog = document.querySelector('[role="dialog"], .modal-backdrop-askai');
        const closeBtn = dialog?.querySelector('button[aria-label*="lose"], button:has(svg)');
        if (closeBtn instanceof HTMLElement) closeBtn.click();

        scheduleTimeout(() => {
          const firstCard = document.querySelector('[class*="cardLink"], [class*="PostCard"] a');
          if (firstCard instanceof HTMLElement) {
            firstCard.click();
          }
        }, 500);
      }, 100);
    };

    const attachLinkHandlers = () => {
      const links = document.querySelectorAll('.ss-infinite-hits-anchor');
      links.forEach((link) => {
        if (!link.hasAttribute('data-has-handler')) {
          link.addEventListener('click', handleLinkClick);
          link.setAttribute('data-has-handler', 'true');
        }
      });
    };

    // Single MutationObserver handles both concerns
    const observer = new MutationObserver((mutations) => {
      // Check for new Ask AI modal/dialog nodes
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (
              node.matches('[role="dialog"], .ss-modal, .modal-backdrop-askai') ||
              node.querySelector('[role="dialog"], .ss-modal, .ss-chat-input')
            ) {
              focusChatInput();
              scheduleTimeout(focusChatInput, 10);
            }
          }
        }
      }

      // Attach handlers to any new SiteSearch result links
      attachLinkHandlers();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    attachLinkHandlers();

    // Click listener for Ask AI button — class-based selectors only
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.sitesearch-button-aa, .ss-button, [class*="ask-ai"]')) {
        requestAnimationFrame(focusChatInput);
        scheduleTimeout(focusChatInput, 10);
        scheduleTimeout(focusChatInput, 50);
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleDocumentClick);
      clearPendingTimeouts();
    };
  }, [isEnabled, router]);

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

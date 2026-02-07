'use client';

import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';
import {
  InstantSearch,
  RefinementList,
  Stats,
  ClearRefinements,
  Configure,
  EXPERIMENTAL_Autocomplete,
  Highlight,
} from 'react-instantsearch';
import { SiAlgolia } from 'react-icons/si';
import styles from './SearchPage.module.css';
import UnifiedHitCard from './UnifiedHitCard';
import GroupedTagFilter from './GroupedTagFilter';
import InfiniteHits from './InfiniteHits';
import LoadingIndicator from './LoadingIndicator';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'system-notes';
const suggestionsIndexName =
  process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME || 'merged_search_query_suggestions';

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
  if (!searchClient) {
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
      <InstantSearch searchClient={searchClient} indexName={indexName} insights={insightsConfig}>
        <Configure hitsPerPage={20} />

        <header className={styles.searchHeader}>
          <EXPERIMENTAL_Autocomplete
            placeholder="Search facts..."
            classNames={{
              root: styles.autocompleteRoot,
            }}
            searchParameters={{
              hitsPerPage: 6,
            }}
            indices={[
              {
                indexName,
                headerComponent: ({ items }) => (
                  <div className={styles.autocompleteHeader} hidden={!items.length}>
                    <span className={styles.autocompleteHeaderTitle}>Results</span>
                    <span className={styles.autocompleteHeaderLine} />
                  </div>
                ),
                itemComponent: ({ item, onSelect }) => {
                  const typedItem = item as {
                    title?: string;
                    name?: string;
                    query?: string;
                    blurb?: string;
                    url?: string;
                    objectID?: string;
                  };
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const highlightItem = item as any;

                  return (
                    <button
                      type="button"
                      className={styles.autocompleteResultButton}
                      onClick={onSelect}
                    >
                      <span className={styles.autocompleteResultTitle}>
                        {typedItem.title || typedItem.name || typedItem.query ? (
                          <Highlight
                            attribute={
                              typedItem.title ? 'title' : typedItem.name ? 'name' : 'query'
                            }
                            hit={highlightItem}
                          />
                        ) : (
                          'Untitled'
                        )}
                      </span>
                      {typedItem.blurb ? (
                        <span className={styles.autocompleteResultSubtitle}>
                          <Highlight attribute="blurb" hit={highlightItem} />
                        </span>
                      ) : null}
                    </button>
                  );
                },
              },
            ]}
            showSuggestions={{
              indexName: suggestionsIndexName,
              headerComponent: ({ items }) => (
                <div className={styles.autocompleteHeader} hidden={!items.length}>
                  <span className={styles.autocompleteHeaderTitle}>Suggestions</span>
                  <span className={styles.autocompleteHeaderLine} />
                </div>
              ),
              itemComponent: ({ item, onSelect }) => {
                const typedItem = item as { query?: string };

                return (
                  <button
                    type="button"
                    className={styles.autocompleteSuggestionButton}
                    onClick={onSelect}
                  >
                    {typedItem.query}
                  </button>
                );
              },
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelect={(params: any) => {
              const { item, query, setQuery, setIsOpen } = params;
              const typedItem = item as { title?: string; name?: string; query?: string };
              const nextQuery = typedItem?.title || typedItem?.name || typedItem?.query || query;
              if (setQuery) {
                setQuery(nextQuery);
              }
              if (setIsOpen) {
                setIsOpen(false);
              }
            }}
          />
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
              {/* Heading removed per requirements */}
              <div className={styles.refinementGroup}>
                <h3 className={styles.refinementTitle}>Category</h3>
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
                <h3 className={styles.refinementTitle}>Builds</h3>
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
                <h3 className={styles.refinementTitle}>Tags</h3>
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

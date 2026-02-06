'use client';

import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  ClearRefinements,
  Configure,
} from 'react-instantsearch';
import styles from './SearchPage.module.css';
import FactCard from '../FactCard/FactCard';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'system-notes';

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
          <h1 className={styles.title}>Fact Index</h1>
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
        <Configure hitsPerPage={12} />

        <header className={styles.searchHeader}>
          <h1 className={styles.title}>Fact Index</h1>
          <SearchBox
            placeholder="Search facts..."
            classNames={{
              root: styles.searchBoxRoot,
              form: styles.searchBoxForm,
              input: styles.searchBoxInput,
              submit: styles.searchBoxSubmit,
              reset: styles.searchBoxReset,
              submitIcon: styles.searchBoxIcon,
              resetIcon: styles.searchBoxIcon,
            }}
          />
        </header>

        <div className={styles.statsRow}>
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
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h2 className={styles.filterTitle}>Filter</h2>

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
                <h3 className={styles.refinementTitle}>Projects</h3>
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
                <RefinementList
                  attribute="tags"
                  limit={10}
                  showMore
                  showMoreLimit={30}
                  classNames={{
                    root: styles.refinementRoot,
                    list: styles.refinementList,
                    item: styles.refinementItem,
                    selectedItem: styles.refinementItemSelected,
                    label: styles.refinementLabel,
                    checkbox: styles.refinementCheckbox,
                    labelText: styles.refinementLabelText,
                    count: styles.refinementCount,
                    showMore: styles.showMoreButton,
                  }}
                />
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
            <Hits
              hitComponent={FactCard}
              classNames={{
                root: styles.hitsRoot,
                list: styles.hitsList,
                item: styles.hitsItem,
              }}
            />

            <Pagination
              classNames={{
                root: styles.paginationRoot,
                list: styles.paginationList,
                item: styles.paginationItem,
                selectedItem: styles.paginationItemSelected,
                disabledItem: styles.paginationItemDisabled,
                link: styles.paginationLink,
              }}
            />
          </section>
        </div>
      </InstantSearch>
    </div>
  );
}

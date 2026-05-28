'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import {
  InstantSearch,
  Configure,
  useSearchBox,
  useStats,
  useMenu,
  useClearRefinements,
} from 'react-instantsearch';
import aa from 'search-insights';
import { SiAlgolia } from 'react-icons/si';
import 'instantsearch.css/themes/reset.css';
import styles from './SearchPage.module.css';
import FactCard from '../FactCard/FactCard';
import ResultsGrid from './ResultsGrid';
import Pagination from './Pagination';
import LoadingIndicator from './LoadingIndicator';
import { createSearchRouting } from './searchRouting';
import { ALGOLIA_INDEX } from '@/config';
import { getChatSessionId } from '@/utils/userToken';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';

const appId = ALGOLIA_APP_ID;
const searchKey = ALGOLIA_SEARCH_KEY;
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

const hasCredentials = hasValidAlgoliaCredentials();
const searchClient = hasCredentials ? algoliasearch(appId, searchKey) : null;

// Same userToken for search + Insights so queryID correlates to click events.
aa('setUserToken', getChatSessionId());

const KIND_ATTRIBUTE = 'category';
const PROJECT_ATTRIBUTE = 'projects';
const TAG_ATTRIBUTE = 'tags.lvl0';

export default function SearchPage() {
  const routing = useMemo(() => createSearchRouting(indexName), []);

  if (!hasCredentials || !searchClient) {
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
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure
          hitsPerPage={24}
          attributesToHighlight={['title', 'blurb', 'fact']}
          clickAnalytics
        />

        <RetrieveBar />
        <div className={styles.retrieveAttribution}>
          <AlgoliaAttribution />
        </div>
        <FilterBar />
        <SectionHeader />

        <section className={styles.results} aria-label="Search results">
          <LoadingIndicator />
          <ResultsGrid
            hitComponent={
              FactCard as React.ComponentType<{
                hit: import('instantsearch.js').Hit;
                sendEvent?: import('@/types/algolia').SendEventForHits;
              }>
            }
            classNames={{
              list: styles.hitsList,
              item: styles.hitsItem,
              empty: styles.hitsEmpty,
            }}
          />
          <Pagination
            classNames={{
              root: styles.pagination,
              list: styles.paginationList,
              item: styles.paginationItem,
              itemActive: styles.paginationItemActive,
              itemDisabled: styles.paginationItemDisabled,
              button: styles.paginationButton,
            }}
          />
        </section>
      </InstantSearch>
    </div>
  );
}

function RetrieveBar() {
  const { query, refine } = useSearchBox();
  const { nbHits } = useStats();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (key === 'k' || key === 'f') && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.retrieve} onClick={() => inputRef.current?.focus()}>
      <span className={styles.retrievePrompt} aria-hidden="true">
        retrieve&gt;
      </span>
      <input
        ref={inputRef}
        type="search"
        className={styles.retrieveInput}
        value={query}
        onChange={(e) => refine(e.target.value)}
        placeholder="ask a question · 'how do you review code', 'why ADHD', 'what is Carbon Trace'"
        aria-label="Search the index"
        autoComplete="off"
        spellCheck={false}
      />
      <span className={styles.retrieveMeta}>
        <span>
          <b>{nbHits.toLocaleString()}</b> match{nbHits === 1 ? '' : 'es'}
        </span>
        <span className={styles.retrieveSep}>·</span>
        <span>press</span>
        <kbd className={styles.kbd}>⌘</kbd>
        <kbd className={styles.kbd}>K</kbd>
      </span>
    </div>
  );
}

function FilterBar() {
  return (
    <div className={styles.filterBar}>
      <FilterDropdown attribute={PROJECT_ATTRIBUTE} label="project" />
      <FilterDropdown attribute={TAG_ATTRIBUTE} label="tag" />
      <FilterDropdown attribute={KIND_ATTRIBUTE} label="kind" />
    </div>
  );
}

function FilterDropdown({ attribute, label }: { attribute: string; label: string }) {
  const { items, refine } = useMenu({ attribute, limit: 20, sortBy: ['count:desc'] });
  const { refine: clear, canRefine: canClear } = useClearRefinements({
    includedAttributes: [attribute],
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.isRefined);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Hide the dropdown entirely when there are no facet values to show
  // and nothing is currently refined.
  if (items.length === 0 && !canClear) return null;

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const buttonText = selected ? `${label}: ${selected.label.toLowerCase()}` : `${label}: all`;

  return (
    <div ref={rootRef} className={styles.filterDropdown}>
      <button
        type="button"
        className={`${styles.filterButton} ${selected ? styles.filterButtonActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{buttonText}</span>
        <span aria-hidden="true" className={styles.filterCaret}>
          ▾
        </span>
      </button>
      {open && (
        <div className={styles.filterPopover} role="listbox" aria-label={`${label} filter`}>
          <button
            type="button"
            className={`${styles.filterOption} ${!selected ? styles.filterOptionActive : ''}`}
            onClick={() => {
              clear();
              setOpen(false);
            }}
            role="option"
            aria-selected={!selected}
          >
            <span>all</span>
            <span className={styles.filterCount}>{String(totalCount).padStart(2, '0')}</span>
          </button>
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterOption} ${item.isRefined ? styles.filterOptionActive : ''}`}
              onClick={() => {
                refine(item.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={item.isRefined}
            >
              <span>{item.label.toLowerCase()}</span>
              <span className={styles.filterCount}>{String(item.count).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader() {
  const { nbHits } = useStats();
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionHeaderTitle}>Every choice, on the record.</h2>
      <span className={styles.sectionHeaderMeta}>
        {nbHits.toLocaleString()} entries · sorted by signal
      </span>
    </div>
  );
}

function AlgoliaAttribution() {
  return (
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
  );
}

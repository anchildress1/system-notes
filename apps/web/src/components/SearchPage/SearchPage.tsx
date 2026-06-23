'use client';

import { useMemo, useEffect, useRef, useState, useId } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { createNullCache } from '@algolia/client-common';
import {
  InstantSearch,
  Configure,
  useSearchBox,
  useStats,
  useRefinementList,
  useClearRefinements,
  useDynamicWidgets,
} from 'react-instantsearch';
import aa from 'search-insights';
import { SiAlgolia } from 'react-icons/si';
import 'instantsearch.css/themes/reset.css';
import styles from './SearchPage.module.css';
import FactCard from '../FactCard/FactCard';
import ResultsGrid from './ResultsGrid';
import Pagination from './Pagination';
import LoadingIndicator from './LoadingIndicator';
import Button from '@/components/Button/Button';
import type { ButtonElement } from '@/components/Button/Button';
import { createSearchRouting } from './searchRouting';
import { ALGOLIA_INDEX } from '@/config';
import { getChatSessionId } from '@/utils/userToken';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import { humanizeAttribute } from '@/lib/humanize';

const appId = ALGOLIA_APP_ID;
const searchKey = ALGOLIA_SEARCH_KEY;
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

const hasCredentials = hasValidAlgoliaCredentials();

// Browser build defaults to in-memory response + request caches. Keep them in
// prod for speed; disable in dev so Algolia dashboard changes (renderingContent,
// rules, settings) show up on the next query without a hard reload.
const isDev = process.env.NODE_ENV === 'development';
const clientOptions = isDev
  ? { responsesCache: createNullCache(), requestsCache: createNullCache() }
  : undefined;

const searchClient = hasCredentials ? algoliasearch(appId, searchKey, clientOptions) : null;

// Same userToken for search + Insights so queryID correlates to click events.
aa('setUserToken', getChatSessionId());

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
        <SearchMeta />
        <FilterBar />

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
      if ((e.metaKey || e.ctrlKey) && key === 'k' && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, []);

  return (
    // A <label> focuses its input on click natively, so the whole bar stays
    // clickable without a handler on a non-interactive element. The input keeps
    // its own aria-label, so the surrounding text doesn't pollute its name.
    <label className={styles.retrieve}>
      <span className={styles.retrievePrompt} aria-hidden="true">
        retrieve&gt;
      </span>
      <input
        ref={inputRef}
        type="search"
        className={styles.retrieveInput}
        value={query}
        onChange={(e) => refine(e.target.value)}
        placeholder="search by keyword · 'code review', 'adhd', 'carbon trace'"
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
    </label>
  );
}

function FilterBar() {
  // Facet list, order, and pinned values are owned by the index via
  // `renderingContent.facetOrdering` (set in the Algolia dashboard). The hook
  // reads it from the search response, so adding/reordering filters never
  // requires a code change here.
  const { attributesToRender } = useDynamicWidgets({});
  // Defensive: dedupe in case renderingContent.facetOrdering.facets.order lists
  // the same attribute twice. Order-preserving.
  const attributes = useMemo(() => Array.from(new Set(attributesToRender)), [attributesToRender]);

  if (attributes.length === 0) return null;

  return (
    <nav className={styles.filterBar} aria-label="Search filters">
      {attributes.map((attribute) => (
        <FilterDropdown
          key={attribute}
          attribute={attribute}
          label={humanizeAttribute(attribute)}
        />
      ))}
      <ClearAllFilters />
    </nav>
  );
}

function ClearAllFilters() {
  const { refine, canRefine } = useClearRefinements();
  if (!canRefine) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      className={styles.filterClearAll}
      onClick={() => refine()}
      ariaLabel="Clear all active filters"
    >
      clear all ✕
    </Button>
  );
}

function FilterDropdown({ attribute, label }: Readonly<{ attribute: string; label: string }>) {
  // No `sortBy` — let Algolia's `renderingContent.facetOrdering.values[attr].order`
  // (pinned values from the dashboard) drive the order. Setting `sortBy` would
  // silently override it.
  const { items: rawItems, refine } = useRefinementList({
    attribute,
    limit: 20,
    operator: 'or',
  });
  // Defensive: dedupe by value. Some renderingContent + hierarchical-facet
  // combinations (e.g. a value pinned via facetOrdering that also appears in
  // the natural results) cause the hook to return duplicates, which collide
  // on React keys.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return rawItems.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [rawItems]);
  const { refine: clear, canRefine: canClear } = useClearRefinements({
    includedAttributes: [attribute],
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<ButtonElement | null>(null);
  const optionRefs = useRef<(ButtonElement | null)[]>([]);
  const popoverId = useId();
  const wasOpenRef = useRef(false);

  const selectedItems = items.filter((item) => item.isRefined);
  // Option layout: index 0 = "all"; items occupy 1..items.length
  const optionCount = items.length + 1;

  // Close on outside click + Escape + tab-out of dropdown
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    const root = rootRef.current;
    root?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  // Focus management: when opening, move focus to the first selected option
  // (or "all" if nothing is selected). When closing after being open,
  // return focus to the trigger button.
  useEffect(() => {
    if (open) {
      const firstSelectedIdx = items.findIndex((i) => i.isRefined);
      const idx = firstSelectedIdx >= 0 ? firstSelectedIdx + 1 : 0;
      requestAnimationFrame(() => optionRefs.current[idx]?.focus());
    } else if (wasOpenRef.current) {
      buttonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, items]);

  if (items.length === 0 && !canClear) return null;

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const selectedCount = selectedItems.length;
  let buttonText: string;
  if (selectedCount === 0) buttonText = `${label}: all`;
  else if (selectedCount === 1) buttonText = `${label}: ${selectedItems[0].label.toLowerCase()}`;
  else buttonText = `${label}: ${selectedItems[0].label.toLowerCase()} +${selectedCount - 1}`;
  const buttonAria =
    selectedCount === 0
      ? `${label} filter, no selection`
      : `${label} filter, ${selectedCount} selected: ${selectedItems.map((i) => i.label).join(', ')}`;

  const onPopoverKeyDown = (e: React.KeyboardEvent) => {
    const focusedEl = document.activeElement;
    const focusedIdx = optionRefs.current.indexOf(focusedEl as HTMLButtonElement | null);
    if (focusedIdx < 0) return;
    const last = optionCount - 1;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = focusedIdx < last ? focusedIdx + 1 : 0;
        optionRefs.current[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = focusedIdx > 0 ? focusedIdx - 1 : last;
        optionRefs.current[prev]?.focus();
        break;
      }
      case 'Home':
        e.preventDefault();
        optionRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        optionRefs.current[last]?.focus();
        break;
    }
  };

  return (
    <div ref={rootRef} className={styles.filterDropdown}>
      <Button
        ref={buttonRef}
        className={styles.filterButton}
        variant="secondary"
        size="sm"
        data-state={open ? 'open' : selectedCount > 0 ? 'active' : undefined}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={popoverId}
        aria-label={buttonAria}
      >
        <span aria-hidden="true">{buttonText}</span>
        <span aria-hidden="true" className={styles.filterCaret}>
          ▾
        </span>
      </Button>
      {open && (
        <fieldset
          id={popoverId}
          className={styles.filterPopover}
          aria-label={`${label} filter options`}
        >
          <Button
            ref={(el) => {
              optionRefs.current[0] = el;
            }}
            className={styles.filterOption}
            variant="secondary"
            size="sm"
            data-state={selectedCount === 0 ? 'active' : undefined}
            onClick={() => {
              // "all" is a one-shot reset: clear everything in this attribute
              // and close the popover so the action feels final.
              clear();
              setOpen(false);
            }}
            onKeyDown={onPopoverKeyDown}
            aria-pressed={selectedCount === 0}
          >
            <span>all</span>
            <span className={styles.filterCount}>{String(totalCount).padStart(2, '0')}</span>
          </Button>
          {items.map((item, i) => (
            <Button
              key={item.value}
              ref={(el) => {
                optionRefs.current[i + 1] = el;
              }}
              className={styles.filterOption}
              variant="secondary"
              size="sm"
              data-state={item.isRefined ? 'active' : undefined}
              // Multi-select: toggle this value and KEEP popover open so the
              // user can pick more in one pass. Escape, click-outside, or
              // re-clicking the trigger closes it.
              onClick={() => refine(item.value)}
              onKeyDown={onPopoverKeyDown}
              aria-pressed={item.isRefined}
            >
              <span className={styles.filterOptionLabel}>
                <span aria-hidden="true" className={styles.filterCheck}>
                  {item.isRefined ? '✓' : ''}
                </span>
                <span>{item.label.toLowerCase()}</span>
              </span>
              <span className={styles.filterCount}>{String(item.count).padStart(2, '0')}</span>
            </Button>
          ))}
        </fieldset>
      )}
    </div>
  );
}

function SearchMeta() {
  // processingTimeMS is Algolia's server-side query time, straight off the
  // search response. Stat sits left under the search bar; Algolia credit right.
  const { nbHits, processingTimeMS } = useStats();
  return (
    <div className={styles.retrieveAttribution}>
      <span className={styles.searchStat}>
        {nbHits.toLocaleString()} entries · {processingTimeMS}ms
      </span>
      <AlgoliaAttribution />
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
    >
      <span className="algolia-prefix">Powered by</span>
      <span className="algolia-hoverable">
        <SiAlgolia aria-hidden="true" className="algolia-icon" />
        <span className="algolia-name">Algolia</span>
      </span>
    </a>
  );
}

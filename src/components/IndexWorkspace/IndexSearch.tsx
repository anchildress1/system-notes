'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  useClearRefinements,
  useRefinementList,
  useSearchBox,
  useStats,
} from 'react-instantsearch';
import { SiAlgolia } from 'react-icons/si';
import type { IndexPulse } from '@/lib/indexPulse';
import { relativeAge } from '@/lib/relativeAge';
import styles from './IndexWorkspace.module.css';

/** The age depends on the clock, not on a store anything can push to. */
const subscribeToNothing = () => () => {};

/**
 * How much is on file and when it last moved.
 *
 * The age resolves on the client against the reader's own clock. This page is
 * statically rendered, so an age computed on the server would be stamped at
 * build time and then quietly rot.
 */
function IndexPulseLine({ pulse }: Readonly<{ pulse: IndexPulse }>) {
  const age = useSyncExternalStore(
    subscribeToNothing,
    () => relativeAge(pulse.latestCreatedAt),
    () => null
  );

  return (
    <p className={styles.pulse}>
      {pulse.total.toLocaleString()} on file{age ? ` · updated ${age}` : ''}
    </p>
  );
}

export default function IndexSearch({ pulse }: Readonly<{ pulse?: IndexPulse | null }>) {
  const { query, refine: refineQuery } = useSearchBox();
  const { canRefine, refine: clearRefinements } = useClearRefinements();
  const { nbHits, processingTimeMS } = useStats();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.shiftKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    globalThis.addEventListener('keydown', focusSearch);
    return () => globalThis.removeEventListener('keydown', focusSearch);
  }, []);

  const clear = () => {
    refineQuery('');
    clearRefinements();
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchArea}>
      <label className={styles.searchPill}>
        <span className={styles.retrieve} aria-hidden="true">
          retrieve&gt;
        </span>
        <span className="visually-hidden">Search the notes index</span>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search the notes index"
          value={query}
          onChange={(event) => refineQuery(event.target.value)}
          placeholder="ask the index anything…"
          autoComplete="off"
          spellCheck={false}
        />
        {query || canRefine ? (
          <button type="button" onClick={clear} aria-label="Clear search and filters">
            ✕ clear
          </button>
        ) : (
          <kbd>⌘K</kbd>
        )}
      </label>

      <div className={styles.searchMeta}>
        <p aria-live="polite">
          {nbHits.toLocaleString()} {nbHits === 1 ? 'entry' : 'entries'} · {processingTimeMS}ms
        </p>
        {/* Corpus facts, not search state: how much is on file and when it last
            moved. The count above changes with every keystroke; this does not. */}
        {pulse ? <IndexPulseLine pulse={pulse} /> : null}
        <div className={styles.secondaryFilters} aria-label="Additional note filters">
          <FacetFilter attribute="projects" label="Project" />
          <FacetFilter attribute="tags.lvl0" label="Topic" />
          <a
            className={styles.algolia}
            href="https://www.algolia.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Powered by</span>
            <SiAlgolia aria-hidden="true" />
            <span>Algolia</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function FacetFilter({ attribute, label }: Readonly<{ attribute: string; label: string }>) {
  const { items: rawItems, refine } = useRefinementList({ attribute, limit: 40, operator: 'or' });
  const items = useMemo(() => {
    const values = new Set<string>();
    return rawItems.filter((item) => {
      if (values.has(item.value)) return false;
      values.add(item.value);
      return true;
    });
  }, [rawItems]);
  const selectedCount = items.filter((item) => item.isRefined).length;

  if (items.length === 0) return null;

  return (
    <details className={styles.filter}>
      <summary>
        {label}
        {selectedCount > 0 ? <span>{selectedCount}</span> : null}
      </summary>
      <div className={styles.filterOptions}>
        {items.map((item) => (
          <label key={item.value}>
            <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} />
            <span>{item.label}</span>
            <small>{item.count}</small>
          </label>
        ))}
      </div>
    </details>
  );
}

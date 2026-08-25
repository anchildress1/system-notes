'use client';

import { useEffect, useRef } from 'react';
import {
  useClearRefinements,
  useRefinementList,
  useSearchBox,
  useStats,
} from 'react-instantsearch';
import { SiAlgolia } from 'react-icons/si';
import styles from './IndexWorkspace.module.css';

export default function IndexSearch() {
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
      {/* The `retrieve>` prompt is gone. A console prefix on a search field is a
          costume, and it was the loudest one on the site. */}
      <label className={styles.searchPill}>
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

/**
 * Collapses facet values that differ only by case into one control.
 *
 * Algolia matches facet filters case-insensitively, so a link carrying
 * "System Notes" narrows the results even where the records are filed as
 * "System notes". InstantSearch compares isRefined with a strict string
 * equality, so it treated those as two values: it synthesized a checked entry
 * for the refinement with a count of zero, and left the real entry — the one
 * with the count next to it — unchecked. Two boxes for one filter, and the one
 * a reader would click was the wrong one.
 *
 * The merged entry keeps the refined spelling as its value, so refine() toggles
 * the refinement that actually exists rather than adding a second one.
 */
export function mergeFacetItemsByCase<
  T extends { value: string; label: string; count: number; isRefined: boolean },
>(items: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of items) {
    const key = item.value.toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }
    const refined = existing.isRefined ? existing : item;
    const counted = existing.count >= item.count ? existing : item;
    merged.set(key, {
      ...counted,
      value: existing.isRefined || item.isRefined ? refined.value : counted.value,
      isRefined: existing.isRefined || item.isRefined,
      count: Math.max(existing.count, item.count),
    });
  }
  return [...merged.values()];
}

function FacetFilter({ attribute, label }: Readonly<{ attribute: string; label: string }>) {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 40,
    operator: 'or',
    transformItems: mergeFacetItemsByCase,
  });
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

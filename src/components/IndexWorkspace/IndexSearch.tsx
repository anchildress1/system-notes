'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
  const searchId = useId();

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
      {/* A div, not a label. The clear button is a labelable element, so nesting it
          inside a <label> is an invalid content model and made clicking "clear"
          also fire the label's forwarding to the input. The name now comes from a
          real <label> naming only the field, rather than from an aria-label
          duplicating a visually-hidden span the aria-label already overrode. */}
      <div className={styles.searchPill}>
        <label className="visually-hidden" htmlFor={searchId}>
          Search the notes index
        </label>
        <input
          id={searchId}
          ref={inputRef}
          type="search"
          data-focus="ruled"
          value={query}
          onChange={(event) => refineQuery(event.target.value)}
          placeholder="ask the index anything…"
          autoComplete="off"
          spellCheck={false}
        />
        {query || canRefine ? (
          <button
            type="button"
            className="marked-hover"
            onClick={clear}
            aria-label="Clear search and filters"
          >
            ✕ clear
          </button>
        ) : (
          <kbd>⌘K</kbd>
        )}
      </div>

      <div className={styles.searchMeta}>
        {/* Only the hit count is live. processingTimeMS changes on every query even
            when the count does not, so keeping it inside re-announced the whole
            line on each keystroke carrying nothing new.

            The timing is a sibling, not hidden: being outside the region is what
            stops the re-announcement, and hiding it as well would take the number
            away from a reader who went looking for it. */}
        <p>
          <span aria-live="polite">
            {nbHits.toLocaleString()} {nbHits === 1 ? 'entry' : 'entries'}
          </span>
          <span> · {processingTimeMS}ms</span>
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
            <span className="visually-hidden"> (opens in a new tab)</span>
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
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  /* A native <details> stays open until its own summary is clicked again, which
     is right for a disclosure in prose and wrong for a filter menu floating over
     a board: every panel a reader opened stayed open behind the results.

     The listeners are bound only while this panel is open, so a page of filters
     costs nothing at rest. Left uncontrolled on purpose — the summary toggles
     the element natively and onToggle reports it back, which avoids React and
     the browser both trying to own `open`. */
  useEffect(() => {
    const details = detailsRef.current;
    if (!isOpen || !details) return;

    // pointerdown, not click: the panel should be gone by the time the pointer
    // lifts, and a click on a checkbox inside must not count as "outside".
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!details.contains(event.target as Node)) details.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      details.open = false;
      // Focus would otherwise be left on a control that no longer exists.
      details.querySelector('summary')?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  if (items.length === 0) return null;

  return (
    <details
      className={styles.filter}
      ref={detailsRef}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary>
        {label}
        {selectedCount > 0 ? <span>{selectedCount}</span> : null}
      </summary>
      <div className={styles.filterOptions}>
        {items.map((item) => (
          <label key={item.value} className="washed">
            <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} />
            <span>{item.label}</span>
            <small>{item.count}</small>
          </label>
        ))}
      </div>
    </details>
  );
}

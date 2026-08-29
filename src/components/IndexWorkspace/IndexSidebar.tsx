'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import type { Hit } from 'instantsearch.js';
import { useClearRefinements, useRefinementList, useSearchBox } from 'react-instantsearch';
import { getFactHitPosition } from '@/lib/noteContent';
import { fitBoardToWholeRows } from './boardLayout';
import { AWARD_SWATCH, SWATCH_PALETTE } from './swatchPalette';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

// The index owns the taxonomy. Categories are rendered exactly as Algolia
// returns them — no grouping, no relabelling, no fallback bucket — so changing
// a category name is a data change, not a code change.
//
// Swatches follow a category's rank by size: Algolia returns facets ordered by
// count, so the largest category takes the most prominent tone. The palette runs
// pink through paper and gray to near-black rather than one hue's lightness
// ramp, which is what made every filter read as the same color.
//
// The rank is read from the *unfiltered* facet list, held alongside the board's
// census. Refining re-sorts the live list by the narrowed counts, and keying off
// that repainted most of the board the moment a filter was applied, so the
// census could no longer be read as "the same board, with matches lit".
// Every slot stays a fixed distance from the board's own surface; swatchPalette.ts
// carries the separation and the reason, and inverts it for a light board where
// a swatch has to be darker rather than lighter. The ramp used to run down to
// within 5.5 lightness points of the background, and that category looked
// unselectable because filtering it changed nothing a reader could see.

// Awards take a tone of their own, outside the rank palette, and the star in the
// filing list. They previously drew a ring by way of a border, which on a 14x10
// tile with border-box ate four pixels of each side and rendered the award
// visibly smaller than every other tile. This is the one place a name matters,
// and it matches on meaning rather than an exact value, so "Awards", "Award", or
// "Awards ★" all keep the treatment.
function isAwardCategory(value: string | undefined): boolean {
  return /award/i.test(value ?? '');
}

// A category absent from the retained ranking — one that only appears under the
// current refinement — falls back to its live position rather than going
// unstyled.
function swatchStyle(value: string | undefined, rank: number) {
  if (isAwardCategory(value)) return { background: AWARD_SWATCH };
  return { background: SWATCH_PALETTE[rank % SWATCH_PALETTE.length] };
}

interface IndexSidebarProps {
  items: Hit<FactHitRecord>[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * Number of columns the board's auto-fill grid actually resolved to.
 * Reads the computed track list rather than recomputing the CSS in JS, so the
 * stylesheet stays the single source of truth for tile size and gap.
 * Returns 0 only where grid tracks never resolve at all — jsdom — and callers
 * treat that as "don't trim".
 */
function useResolvedColumnCount(): {
  measureRef: (node: HTMLElement | null) => void;
  columns: number;
} {
  const [columns, setColumns] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // A callback ref, not an effect on a ref object: the board only enters the DOM
  // once results arrive, and an effect keyed on the ref would have run once
  // against a null node at mount and never attached.
  const measureRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const measure = () => {
      // A display:none subtree — the collapsed sidebar — reports the *specified*
      // template ("repeat(auto-fill, minmax(16px, 1fr))") rather than resolved
      // pixel tracks, and counting its tokens yields a fake 3. Only a laid-out
      // element has tracks worth reading; while hidden, the last good count is
      // kept so the board does not reflow behind the collapse.
      if (node.getClientRects().length === 0) return;
      const template = globalThis.getComputedStyle(node).gridTemplateColumns;
      const hasResolvedTracks = Boolean(template) && template !== 'none' && !template.includes('(');
      if (!hasResolvedTracks) return;
      const count = template.split(/\s+/).filter(Boolean).length;
      setColumns((previous) => (previous === count ? previous : count));
    };

    // Measure first, and unconditionally. ResizeObserver is only the channel for
    // *subsequent* width changes; gating the initial read on it left the board
    // untrimmed — and so visibly ragged in its last row — wherever the observer
    // is absent.
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { measureRef, columns };
}

export default function IndexSidebar({
  items: rankedItems,
  selectedId,
  onSelect,
}: Readonly<IndexSidebarProps>) {
  const [isOpen, setIsOpen] = useState(true);
  const [activation, setActivation] = useState<{ id: string; nonce: number }>();
  const { items, refine } = useRefinementList({
    attribute: 'category',
    limit: 40,
    operator: 'or',
  });

  const { measureRef: boardRef, columns: boardColumns } = useResolvedColumnCount();
  // canRefine reports whether anything is currently refined across every facet,
  // so this does not need updating when a new filter is added.
  const { canRefine: hasActiveFacets } = useClearRefinements();
  const { query } = useSearchBox();
  const isNarrowed = hasActiveFacets || query.trim().length > 0;

  // The palette ranking is retained the same way the board census is, and for
  // the same reason: both describe the whole index, so neither may be rebuilt
  // from a narrowed response.
  const [ranking, setRanking] = useState<{ key: string; values: string[] }>({
    key: '',
    values: [],
  });
  const unfilteredRankKey = isNarrowed ? null : items.map((item) => item.value).join('\0');
  if (unfilteredRankKey !== null && unfilteredRankKey !== ranking.key) {
    setRanking({ key: unfilteredRankKey, values: items.map((item) => item.value) });
  }

  const categories = useMemo(() => {
    const rankOf = new Map(ranking.values.map((value, index) => [value, index]));
    return items.map((item, index) => ({
      key: item.value,
      label: isAwardCategory(item.value) ? `${item.label} ★` : item.label,
      count: item.count,
      isRefined: item.isRefined,
      swatch: swatchStyle(item.value, rankOf.get(item.value) ?? index),
    }));
  }, [items, ranking]);

  // Tiles take the same tone as their category's filter, matched on the value
  // Algolia reported. A note whose category is not in the current facet list
  // keeps the default tone rather than being reassigned to another category.
  const swatchByCategory = useMemo(
    () => new Map(categories.map((category) => [category.key, category.swatch])),
    [categories]
  );

  // Every tile is a real note — the board is never padded to fill a row.
  //
  // The board is a census, not a result list: it keeps rendering the whole
  // ranked set and recedes the cards that do not match, so filtering shows you
  // where the answer sits inside the index rather than shrinking the index.
  // Algolia only returns matches, so the last unfiltered set is held as the
  // census and the current matches light it.
  // Adjusted during render rather than in an effect: an effect that calls
  // setState triggers a cascading render. The key is a primitive, so the
  // comparison settles after one extra pass instead of looping.
  const [census, setCensus] = useState<{ key: string; items: Hit<FactHitRecord>[] }>({
    key: '',
    items: [],
  });
  const unfilteredKey = isNarrowed
    ? null
    : `${rankedItems.length}:${rankedItems[0]?.objectID ?? ''}`;
  if (unfilteredKey !== null && unfilteredKey !== census.key) {
    setCensus({ key: unfilteredKey, items: rankedItems });
  }
  const boardCensus = isNarrowed && census.items.length > 0 ? census.items : rankedItems;

  const matchedIds = useMemo(
    () => new Set(rankedItems.map((item) => item.objectID)),
    [rankedItems]
  );

  // Trimming to whole rows keeps the board a clean rectangle at every width, and
  // it now applies to the census rather than the result set, so the shape holds
  // steady while a filter is on instead of reflowing under the reader.
  const boardItems = useMemo(
    () => fitBoardToWholeRows(boardCensus, boardColumns),
    [boardCensus, boardColumns]
  );

  // -1 when the selected note is ranked below the board's last tile. Collapsing
  // that to 0 would point aria-activedescendant at a note the reader did not
  // choose and make the next arrow key resume from the wrong tile, so the board
  // reports no active option instead and arrows restart from the top.
  const selectedIndex = boardItems.findIndex((item) => item.objectID === selectedId);
  const activeOptionId = selectedIndex >= 0 ? `note-board-option-${selectedIndex}` : undefined;

  function activateNote(id: string) {
    setActivation((current) => ({ id, nonce: (current?.nonce ?? 0) + 1 }));
    onSelect(id);
  }

  function moveBoardSelection(event: KeyboardEvent<HTMLOListElement>) {
    if (boardItems.length === 0) return;
    // Off-board selections start from the first tile rather than from a
    // position the reader never landed on.
    const currentIndex = Math.max(selectedIndex, 0);
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, boardItems.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = boardItems.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    activateNote(boardItems[nextIndex]!.objectID);
  }

  function selectBoardOption(event: MouseEvent<HTMLOListElement>) {
    const option =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-note-id]') : null;
    if (!option || !event.currentTarget.contains(option)) return;
    event.currentTarget.focus({ preventScroll: true });
    const noteId = option.dataset.noteId;
    if (noteId) activateNote(noteId);
  }

  return (
    <section className={styles.sidebar} data-open={isOpen} aria-label="Browse notes by type">
      <button
        className={styles.sidebarToggle}
        type="button"
        aria-expanded={isOpen}
        aria-controls="index-catalog"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{isOpen ? 'Filed under' : 'Menu'}</span>
        <span aria-hidden="true">{isOpen ? '«' : '»'}</span>
      </button>

      <div id="index-catalog" className={styles.catalog}>
        <ul className={styles.categoryList}>
          {categories.map((category) => (
            <li key={category.key}>
              <button
                type="button"
                data-category={category.key}
                data-selected={category.isRefined || undefined}
                aria-label={`${category.label}, ${category.count.toLocaleString()} notes`}
                aria-pressed={category.isRefined}
                onClick={() => refine(category.key)}
              >
                <span
                  className={styles.categorySwatch}
                  style={category.swatch}
                  aria-hidden="true"
                />
                <span className={styles.categoryName}>{category.label}</span>
                <span className={styles.categoryCount}>
                  {category.count.toLocaleString()} {category.isRefined ? '−' : '+'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {boardItems.length > 0 ? (
          <div className={styles.board}>
            <p>
              {/* "N of M" only while trimmed, so the board never states a
                  different total from the number of tiles under it. */}
              The board — one tile per card ·{' '}
              {boardItems.length < boardCensus.length
                ? `${boardItems.length.toLocaleString()} of ${boardCensus.length.toLocaleString()}`
                : boardCensus.length.toLocaleString()}{' '}
              <span aria-hidden="true">↑</span>
            </p>
            <ol
              ref={boardRef}
              className={styles.boardTiles}
              data-note-board
              role="listbox"
              tabIndex={0}
              aria-label="Top ranked notes"
              aria-describedby="note-board-instructions"
              aria-activedescendant={activeOptionId}
              onClick={selectBoardOption}
              onKeyDown={moveBoardSelection}
            >
              {boardItems.map((item, index) => {
                const position = getFactHitPosition(item, index + 1);
                return (
                  <li
                    id={`note-board-option-${index}`}
                    key={
                      item.objectID === activation?.id
                        ? `${item.objectID}:${activation.nonce}`
                        : item.objectID
                    }
                    role="option"
                    data-note-id={item.objectID}
                    data-category={item.category}
                    style={
                      {
                        '--tile-swatch': swatchByCategory.get(item.category)?.background,
                        '--tile-opacity': matchedIds.has(item.objectID) ? '1' : '0.13',
                      } as CSSProperties
                    }
                    data-activated={item.objectID === activation?.id || undefined}
                    aria-label={`Read note ${position}: ${item.title}`}
                    aria-selected={item.objectID === selectedId}
                    title={`${position}. ${item.title}`}
                  />
                );
              })}
            </ol>
            {/* Kept for the listbox's aria-describedby and hidden from the page.
                It documents the keyboard model, which is the one audience that
                cannot see the board and work it out. */}
            <small id="note-board-instructions" className="visually-hidden">
              one tile per card · click a tile, or use search and the queue below, to read one ·
              arrow keys move one tile, Home and End jump
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

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
import { assignSwatches } from './swatchPalette';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

// The index owns the taxonomy. Categories are rendered exactly as Algolia
// returns them — no grouping, no relabelling, no fallback bucket — so changing
// a category name is a data change, not a code change.
//
// Swatches follow a category's rank by size: Algolia returns facets ordered by
// count, so the largest category takes the strongest tone. The palette is a
// neutral ladder with one yellow slot; rank varies value, never hue.
//
// The rank is read from the *unfiltered* facet list, held alongside the board's
// census. Refining re-sorts the live list by the narrowed counts, and keying off
// that repainted most of the board the moment a filter was applied, so the
// census could no longer be read as "the same board, with matches lit".
// Every slot has to stay readable against the board it is drawn on; the tones and
// the keyline that separates them live in globals.css, beside the --k-* tokens.
// The ramp used to run down to within 5.5 lightness points of the background, and
// that category looked unselectable because filtering it changed nothing a reader
// could see.

// Awards take a tone of their own, outside the rank palette, and the star in the
// filing list. They previously drew a ring by way of a border, which on a 14x10
// tile with border-box ate four pixels of each side and rendered the award
// visibly smaller than every other tile. This is the one place a name matters,
// and it matches on meaning rather than an exact value, so "Awards", "Award", or
// "Awards ★" all keep the treatment.
function isAwardCategory(value: string | undefined): boolean {
  return /award/i.test(value ?? '');
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
  const typeahead = useRef({ value: '', updatedAt: 0 });
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
    // The retained ranking decides the order; a category absent from it — one
    // that only appears under the current refinement — is appended rather than
    // going unstyled. Ranks are then assigned over that whole order at once, so
    // the award tone never displaces a rank slot.
    const ordered = [...ranking.values];
    for (const item of items) if (!ordered.includes(item.value)) ordered.push(item.value);
    const swatchOf = assignSwatches(ordered, (value) => isAwardCategory(value));

    return (
      items
        // A category the narrowed set does not contain cannot filter it, so it
        // is not offered. Algolia already drops those, EXCEPT one it is still
        // refined by — that one stays, because hiding it would strand the
        // refinement emptying the page with no control to lift it.
        .filter((item) => item.count > 0 || item.isRefined)
        .map((item) => ({
          key: item.value,
          label: isAwardCategory(item.value) ? `${item.label} ★` : item.label,
          count: item.count,
          isRefined: item.isRefined,
          isAward: isAwardCategory(item.value),
          swatch: { background: swatchOf.get(item.value) },
        }))
    );
  }, [items, ranking]);

  // Tiles take the same tone as their category's filter, matched on the value
  // Algolia reported. A note whose category is not in the current facet list
  // keeps the default tone rather than being reassigned to another category.
  const swatchByCategory = useMemo(
    () => new Map(categories.map((category) => [category.key, category.swatch])),
    [categories]
  );

  // An award tile is drawn as a ring rather than a fill, so it needs the flag
  // and not just the tone — the two resolve to the same pigment.
  const awardCategories = useMemo(
    () => new Set(categories.filter((category) => category.isAward).map((c) => c.key)),
    [categories]
  );

  // Every tile is a real note, and every tile on the board is a MATCH.
  //
  // This was a census: it kept the whole ranked set on screen and dropped
  // non-matching tiles to 0.13 opacity, on the theory that showing where an
  // answer sits inside the index beats shrinking the index. What it actually
  // rendered was a grid three-quarters full of grey — indistinguishable from a
  // disabled control, and nothing in a grid of clickable tiles should ever look
  // disabled. A tile is relevant and shown, or it is not there.
  //
  // The board reflows when a filter narrows it. That is the cost, and it is the
  // right one: a reflow reads as the index responding, where a wall of dimmed
  // tiles reads as the interface having broken.
  const boardItems = useMemo(
    () => fitBoardToWholeRows(rankedItems, boardColumns),
    [rankedItems, boardColumns]
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

  /**
   * Where a printable key should move the selection.
   *
   * @param event The keydown that carried the character.
   * @returns The option index to activate, or undefined to leave the selection
   *   where it is — which covers a leading space, and a prefix the current
   *   option already satisfies.
   */
  function typeaheadTarget(event: KeyboardEvent<HTMLOListElement>): number | undefined {
    const now = Date.now();
    const continuesPrefix =
      now - typeahead.current.updatedAt <= 700 && typeahead.current.value.length > 0;
    if (event.key === ' ' && !continuesPrefix) return undefined;

    const typed = event.key.toLocaleLowerCase();
    // One character pressed repeatedly cycles through options starting with it
    // rather than searching for a run of that character.
    const repeatsOneCharacter =
      continuesPrefix &&
      typed !== ' ' &&
      [...typeahead.current.value].every((character) => character === typed);
    let value = typed;
    if (continuesPrefix && !repeatsOneCharacter) value = typeahead.current.value + typed;
    typeahead.current = { value, updatedAt: now };
    event.preventDefault();

    const settled =
      continuesPrefix &&
      !repeatsOneCharacter &&
      selectedIndex >= 0 &&
      boardItems[selectedIndex]!.title.trim().toLocaleLowerCase().startsWith(value);
    if (settled) return undefined;

    // Search after the current option and wrap. The title is also the first
    // part of the accessible name, so the spoken and keyboard models agree.
    const start = selectedIndex >= 0 ? selectedIndex : -1;
    for (let offset = 1; offset <= boardItems.length; offset += 1) {
      const candidate = (start + offset) % boardItems.length;
      if (boardItems[candidate]!.title.trim().toLocaleLowerCase().startsWith(value)) {
        return candidate;
      }
    }
    return undefined;
  }

  function moveBoardSelection(event: KeyboardEvent<HTMLOListElement>) {
    if (boardItems.length === 0) return;
    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      typeahead.current = { value: '', updatedAt: 0 };
    }
    // Off-board selections start from the first tile rather than from a
    // position the reader never landed on.
    const currentIndex = selectedIndex;
    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = currentIndex >= 0 ? Math.min(currentIndex + 1, boardItems.length - 1) : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = currentIndex >= 0 ? Math.max(currentIndex - 1, 0) : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = boardItems.length - 1;
        break;
      default: {
        if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
          return;
        }
        nextIndex = typeaheadTarget(event);
        break;
      }
    }

    if (nextIndex === undefined) return;
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
                className="washed"
                data-category={category.key}
                data-selected={category.isRefined || undefined}
                aria-label={
                  category.count > 0
                    ? `${category.label}, ${category.count.toLocaleString()} notes`
                    : `${category.label}, no matching notes`
                }
                aria-pressed={category.isRefined}
                onClick={() => refine(category.key)}
              >
                <span
                  className={styles.categorySwatch}
                  /* An award draws its ring from CSS. An inline background here
                     would win over it and fill the chip back in, which is the
                     one thing the ring exists to avoid. */
                  style={category.isAward ? undefined : category.swatch}
                  data-award={category.isAward || undefined}
                  aria-hidden="true"
                />
                <span className={styles.categoryName}>{category.label}</span>
                <span className={styles.categoryCount}>
                  {/* No numeral on a refined category the narrowed set emptied.
                      A row reading "0 −" is a count of nothing standing where a
                      filter's size belongs; the sign alone still lifts it. */}
                  {category.count > 0 ? `${category.count.toLocaleString()} ` : ''}
                  {category.isRefined ? '−' : '+'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {boardItems.length > 0 ? (
          <div className={styles.board}>
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
                    data-award={awardCategories.has(item.category) || undefined}
                    style={
                      {
                        '--tile-swatch': swatchByCategory.get(item.category)?.background,
                      } as CSSProperties
                    }
                    data-activated={item.objectID === activation?.id || undefined}
                    aria-label={`${item.title}, position ${position}`}
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
              arrow keys move one tile, Home and End jump, and typing a title moves to its match
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

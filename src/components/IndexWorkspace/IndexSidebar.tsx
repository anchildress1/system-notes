'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import type { Hit } from 'instantsearch.js';
import {
  useClearRefinements,
  useRefinementList,
  useSearchBox,
  useStats,
} from 'react-instantsearch';
import { getFactHitPosition } from '@/lib/noteContent';
import { fitBoardToWholeRows } from './boardLayout';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

const categoryGroups = [
  {
    key: 'principle',
    label: 'principles',
    values: ['principle', 'philosophy', 'work style', 'about'],
  },
  { key: 'architecture', label: 'architecture', values: ['architecture', 'constraint'] },
  {
    key: 'decision',
    label: 'decisions',
    values: ['decision', 'process', 'experience', 'experimentation'],
  },
  { key: 'award', label: 'awards ★', values: ['award'] },
] as const;

function normalizeCategory(value: string): string {
  const normalized = value.trim().toLowerCase();
  const plurals: Record<string, string> = {
    principles: 'principle',
    constraints: 'constraint',
    decisions: 'decision',
    awards: 'award',
  };
  return plurals[normalized] ?? normalized;
}

function getFilingFamily(category: string | undefined): (typeof categoryGroups)[number]['key'] {
  const normalized = normalizeCategory(category ?? '');
  return (
    categoryGroups.find((group) => group.values.some((value) => value === normalized))?.key ??
    'decision'
  );
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
 * Returns 0 when it cannot be measured (no ResizeObserver, or jsdom, which does
 * not resolve grid tracks) — callers treat that as "don't trim".
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
    if (!node || typeof ResizeObserver === 'undefined') return;

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

    measure();
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
  const { nbHits } = useStats();
  const { items, refine } = useRefinementList({
    attribute: 'category',
    limit: 40,
    operator: 'or',
  });
  // Every category the index returns gets its own filter. Folding them into a
  // fixed set of families hid whichever values were not on that list, so a
  // migration that changes the taxonomy would have needed a code change here to
  // become visible. The swatch still resolves through getFilingFamily, and an
  // unrecognised category falls back to the default swatch rather than vanishing.
  const categories = useMemo(
    () =>
      items.map((item) => {
        const family = getFilingFamily(item.value);
        const label = item.label.toLocaleLowerCase();
        return {
          key: item.value,
          family,
          label: family === 'award' ? `${label} ★` : label,
          count: item.count,
          isRefined: item.isRefined,
        };
      }),
    [items]
  );
  const { measureRef: boardRef, columns: boardColumns } = useResolvedColumnCount();
  // canRefine reports whether anything is currently refined across every facet,
  // so this does not need updating when a new filter is added.
  const { canRefine: hasActiveFacets } = useClearRefinements();
  const { query } = useSearchBox();
  const isNarrowed = hasActiveFacets || query.trim().length > 0;

  // Every tile is a real note — the board is never padded to fill a row.
  //
  // Narrowing the index is a question, and the whole answer should be visible,
  // so a query or an active facet renders every match and the last row lands
  // wherever it lands. Unfiltered, the board is a shape rather than a result
  // set: the grid auto-fills columns from the sidebar's width, so trimming to
  // whole rows keeps it a clean rectangle instead of a ragged part-row that
  // changes with the window.
  //
  // The tiles dropped there are the lowest-ranked, and searching or filtering
  // brings them back because both paths render every match. The reading queue
  // does not — it shows the top VISIBLE_NOTE_LIMIT of the same ranking, so it
  // can never surface a trimmed tile.
  const boardItems = useMemo(() => {
    if (isNarrowed) return rankedItems;
    return fitBoardToWholeRows(rankedItems, boardColumns);
  }, [rankedItems, boardColumns, isNarrowed]);

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
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
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
        <span>{isOpen ? 'Browse by type' : 'Types'}</span>
        <span aria-hidden="true">{isOpen ? '«' : '»'}</span>
      </button>

      <div id="index-catalog" className={styles.catalog}>
        <ul className={styles.categoryList}>
          {categories.map((category) => (
            <li key={category.key}>
              <button
                type="button"
                data-category={category.family}
                data-selected={category.isRefined || undefined}
                aria-label={`${category.label}, ${category.count.toLocaleString()} notes`}
                aria-pressed={category.isRefined}
                onClick={() => refine(category.key)}
              >
                <span className={styles.categorySwatch} aria-hidden="true" />
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
                  different total from the queue beside it without saying why. */}
              The board —{' '}
              {boardItems.length === rankedItems.length
                ? `${boardItems.length.toLocaleString()} ranked`
                : `${boardItems.length.toLocaleString()} of ${rankedItems.length.toLocaleString()} ranked`}{' '}
              · {nbHits.toLocaleString()} {nbHits === 1 ? 'match' : 'matches'}
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
                    data-category={getFilingFamily(item.category)}
                    data-activated={item.objectID === activation?.id || undefined}
                    aria-label={`Read note ${position}: ${item.title}`}
                    aria-selected={item.objectID === selectedId}
                    title={`${position}. ${item.title}`}
                  />
                );
              })}
            </ol>
            <small id="note-board-instructions">
              One tab stop. Arrow keys move one note; Home/End jumps. Click any tile.
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

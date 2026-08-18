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
import { useRefinementList, useStats } from 'react-instantsearch';
import { getFactHitPosition } from '@/lib/noteContent';
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
      const template = globalThis.getComputedStyle(node).gridTemplateColumns;
      const count =
        template && template !== 'none' ? template.split(/\s+/).filter(Boolean).length : 0;
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
  const categories = useMemo(() => {
    const groupedValues = new Set<string>(categoryGroups.flatMap((group) => [...group.values]));
    const groups = categoryGroups.flatMap((group) => {
      const values = new Set<string>(group.values);
      const groupItems = items.filter((item) => values.has(normalizeCategory(item.value)));
      if (groupItems.length === 0) return [];
      return [
        {
          key: group.key,
          label: group.label,
          items: groupItems,
          count: groupItems.reduce((total, item) => total + item.count, 0),
          isRefined: groupItems.some((item) => item.isRefined),
          isFullyRefined: groupItems.every((item) => item.isRefined),
        },
      ];
    });
    const otherItems = items.filter((item) => !groupedValues.has(normalizeCategory(item.value)));
    if (otherItems.length === 0) return groups;
    return [
      ...groups,
      {
        key: 'other',
        label: 'other',
        items: otherItems,
        count: otherItems.reduce((total, item) => total + item.count, 0),
        isRefined: otherItems.some((item) => item.isRefined),
        isFullyRefined: otherItems.every((item) => item.isRefined),
      },
    ];
  }, [items]);
  const { measureRef: boardRef, columns: boardColumns } = useResolvedColumnCount();

  // The grid auto-fills columns from the sidebar's width, so a fixed tile count
  // leaves a ragged part-row at whatever width the last row does not divide
  // into. Trim to whole rows instead: the board stays a clean rectangle at every
  // size, and the tiles it drops are the lowest-ranked ones, still reachable
  // through search and the reading queue. Below one full row there is nothing to
  // square off, so everything renders.
  const boardItems = useMemo(() => {
    if (boardColumns < 1 || rankedItems.length < boardColumns) return rankedItems;
    return rankedItems.slice(0, Math.floor(rankedItems.length / boardColumns) * boardColumns);
  }, [rankedItems, boardColumns]);

  const selectedIndex = Math.max(
    boardItems.findIndex((item) => item.objectID === selectedId),
    0
  );
  const activeOptionId = boardItems.length > 0 ? `note-board-option-${selectedIndex}` : undefined;

  function activateNote(id: string) {
    setActivation((current) => ({ id, nonce: (current?.nonce ?? 0) + 1 }));
    onSelect(id);
  }

  function moveBoardSelection(event: KeyboardEvent<HTMLOListElement>) {
    if (boardItems.length === 0) return;
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = Math.min(selectedIndex + 1, boardItems.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = Math.max(selectedIndex - 1, 0);
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
                data-category={category.key}
                data-selected={category.isRefined || undefined}
                aria-label={`${category.label}, ${category.count.toLocaleString()} notes`}
                aria-pressed={category.isFullyRefined ? true : category.isRefined ? 'mixed' : false}
                onClick={() => {
                  const shouldSelect = !category.isFullyRefined;
                  for (const item of category.items) {
                    if (item.isRefined !== shouldSelect) refine(item.value);
                  }
                }}
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
              The board — {boardItems.length.toLocaleString()} ranked · {nbHits.toLocaleString()}{' '}
              {nbHits === 1 ? 'match' : 'matches'}
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

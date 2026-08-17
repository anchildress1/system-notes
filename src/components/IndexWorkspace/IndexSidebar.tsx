'use client';

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
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
  const selectedIndex = Math.max(
    rankedItems.findIndex((item) => item.objectID === selectedId),
    0
  );
  const activeOptionId = rankedItems.length > 0 ? `note-board-option-${selectedIndex}` : undefined;

  function activateNote(id: string) {
    setActivation((current) => ({ id, nonce: (current?.nonce ?? 0) + 1 }));
    onSelect(id);
  }

  function moveBoardSelection(event: KeyboardEvent<HTMLOListElement>) {
    if (rankedItems.length === 0) return;
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = Math.min(selectedIndex + 1, rankedItems.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = rankedItems.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    activateNote(rankedItems[nextIndex]!.objectID);
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

        {rankedItems.length > 0 ? (
          <div className={styles.board}>
            <p>
              The board — {rankedItems.length.toLocaleString()} ranked · {nbHits.toLocaleString()}{' '}
              {nbHits === 1 ? 'match' : 'matches'}
            </p>
            <ol
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
              {rankedItems.map((item, index) => {
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

'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Hit } from 'instantsearch.js';
import { useRefinementList, useStats } from 'react-instantsearch';
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
  activatedId?: string;
  onSelect: (id: string) => void;
}

export default function IndexSidebar({
  items: rankedItems,
  selectedId,
  activatedId,
  onSelect,
}: Readonly<IndexSidebarProps>) {
  const [isOpen, setIsOpen] = useState(true);
  const [focusedId, setFocusedId] = useState<string>();
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
  const tabStopId = rankedItems.some((item) => item.objectID === focusedId)
    ? focusedId
    : selectedId;

  function moveBoardFocus(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % rankedItems.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + rankedItems.length) % rankedItems.length;
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
    const buttons = event.currentTarget
      .closest('ol')
      ?.querySelectorAll<HTMLButtonElement>('button');
    if (!buttons) return;
    buttons.item(nextIndex).focus();
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
              The board — top {rankedItems.length.toLocaleString()} of {nbHits.toLocaleString()}
            </p>
            <ol
              className={styles.boardTiles}
              data-note-board
              aria-label="Top ranked notes"
              aria-describedby="note-board-instructions"
            >
              {rankedItems.map((item, index) => (
                <li key={item.objectID}>
                  <button
                    type="button"
                    data-category={getFilingFamily(item.category)}
                    data-selected={item.objectID === selectedId || undefined}
                    data-activated={item.objectID === activatedId || undefined}
                    aria-label={`Read note ${index + 1}: ${item.title}`}
                    aria-pressed={item.objectID === selectedId}
                    tabIndex={item.objectID === tabStopId ? 0 : -1}
                    title={`${index + 1}. ${item.title}`}
                    onClick={() => {
                      setFocusedId(item.objectID);
                      onSelect(item.objectID);
                    }}
                    onFocus={() => setFocusedId(item.objectID)}
                    onKeyDown={(event) => moveBoardFocus(event, index)}
                  />
                </li>
              ))}
            </ol>
            <small id="note-board-instructions">
              Arrow through the board. Select a tile to bring that note into the reader.
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

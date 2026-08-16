'use client';

import { useMemo, useState } from 'react';
import { useRefinementList, useStats } from 'react-instantsearch';
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

export default function IndexSidebar() {
  const [isOpen, setIsOpen] = useState(true);
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
  const tiles = useMemo(() => {
    const remaining = categories.map((category) => ({
      key: category.key,
      count: category.count,
      isRefined: category.isRefined,
    }));
    const nextTiles: Array<{ key: string; isDimmed: boolean; id: string }> = [];
    let round = 0;

    while (remaining.some((category) => category.count > 0)) {
      for (const category of remaining) {
        if (category.count <= 0) continue;
        nextTiles.push({
          key: category.key,
          isDimmed: categories.some((item) => item.isRefined) && !category.isRefined,
          id: `${category.key}-${round}-${category.count}`,
        });
        category.count -= 1;
      }
      round += 1;
    }

    return nextTiles;
  }, [categories]);

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

        {tiles.length > 0 ? (
          <div className={styles.board} aria-hidden="true">
            <p>The board — one tile per note · {nbHits.toLocaleString()} ↑</p>
            <div className={styles.boardTiles} data-note-board>
              {tiles.map((tile) => (
                <span
                  key={tile.id}
                  data-category={tile.key}
                  data-dimmed={tile.isDimmed || undefined}
                />
              ))}
            </div>
            <small>The index at a glance. A tile appears when a note is filed.</small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

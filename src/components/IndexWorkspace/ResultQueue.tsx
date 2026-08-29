'use client';

import { useEffect, useRef } from 'react';
import type { Hit } from 'instantsearch.js';
import FactCard from '@/components/FactCard/FactCard';
import { formatNoteDate, getFactHitPosition, getNoteProjects } from '@/lib/noteContent';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

const VISIBLE_NOTE_LIMIT = 5;

interface ResultQueueProps {
  items: Hit<FactHitRecord>[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function ResultQueue({ items, selectedId, onSelect }: Readonly<ResultQueueProps>) {
  const readerRef = useRef<HTMLDivElement>(null);
  const shouldFocusReader = useRef(false);
  const featuredIndex = Math.max(
    items.findIndex((item) => item.objectID === selectedId),
    0
  );
  const featured = items[featuredIndex];

  useEffect(() => {
    if (!shouldFocusReader.current) return;
    shouldFocusReader.current = false;
    readerRef.current?.focus({ preventScroll: true });
  }, [featured?.objectID]);

  if (!featured) return null;
  const alternatives = items
    .map((hit, index) => ({ hit, index }))
    .filter(({ hit }) => hit.objectID !== featured.objectID)
    .slice(0, VISIBLE_NOTE_LIMIT - 1);
  return (
    <section className={styles.results} aria-label="Notes results">
      <h2 className="visually-hidden">Matching notes</h2>
      <div className={styles.readingQueue}>
        <div
          ref={readerRef}
          className={styles.reader}
          tabIndex={-1}
          aria-label={`Now reading: ${featured.title}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <FactCard
            key={featured.objectID}
            hit={featured}
            position={getFactHitPosition(featured, featuredIndex + 1)}
          />
        </div>

        {alternatives.length > 0 ? (
          <ol
            className={styles.queueList}
            data-ranked-queue
            aria-label="Highest-ranked alternate notes"
          >
            {alternatives.map(({ hit, index }) => {
              const position = getFactHitPosition(hit, index + 1);
              const project = getNoteProjects(hit)[0] ?? 'System Notes';
              const date = formatNoteDate(hit.created_at);
              return (
                <li key={hit.objectID}>
                  <button
                    type="button"
                    onClick={() => {
                      shouldFocusReader.current = true;
                      onSelect(hit.objectID);
                    }}
                  >
                    <span className={styles.queueMeta}>
                      <span>
                        № {position} · {project}
                        {date ? ` · ${date}` : ''}
                      </span>
                      <span>{hit.category || 'Note'}</span>
                    </span>
                    <span className={styles.queueTitle}>{hit.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>

      <p className={styles.queueFooter}>
        The board and ranking stay put. Choose an alternate or any board tile to read another note.
      </p>
    </section>
  );
}

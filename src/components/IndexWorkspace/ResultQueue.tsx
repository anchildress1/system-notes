'use client';

import { useEffect, useRef } from 'react';
import type { Hit } from 'instantsearch.js';
import FactCard from '@/components/FactCard/FactCard';
import { formatNoteDate, getFactHitPosition, getNoteProjects } from '@/lib/noteContent';
import type { FactHitRecord, SendEventForHits } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

const VISIBLE_NOTE_LIMIT = 5;

interface ResultQueueProps {
  items: Hit<FactHitRecord>[];
  nbHits: number;
  selectedId?: string;
  focusSelection: boolean;
  onSelect: (id: string) => void;
  sendEvent: SendEventForHits;
}

export default function ResultQueue({
  items,
  nbHits,
  selectedId,
  focusSelection,
  onSelect,
  sendEvent,
}: Readonly<ResultQueueProps>) {
  const readerRef = useRef<HTMLDivElement>(null);
  const featuredIndex = Math.max(
    items.findIndex((item) => item.objectID === selectedId),
    0
  );
  const featured = items[featuredIndex];

  useEffect(() => {
    if (!focusSelection) return;
    const frame = globalThis.requestAnimationFrame(() => {
      const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      readerRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [featured?.objectID, focusSelection]);

  if (!featured) return null;
  const alternatives = items
    .map((hit, index) => ({ hit, index }))
    .filter(({ hit }) => hit.objectID !== featured.objectID)
    .slice(0, VISIBLE_NOTE_LIMIT - 1);
  const visibleCount = alternatives.length + 1;

  return (
    <section className={styles.results} aria-label="Notes results">
      <h2 className="visually-hidden">Matching notes</h2>
      <p className={styles.queueStatus}>
        {visibleCount.toLocaleString()} {visibleCount === 1 ? 'note' : 'notes'} in view ·{' '}
        {items.length.toLocaleString()} ranked on the board · {nbHits.toLocaleString()}{' '}
        {nbHits === 1 ? 'match' : 'matches'}
      </p>

      <div className={styles.readingQueue}>
        <div ref={readerRef} className={styles.reader}>
          <FactCard
            key={`${featured.objectID}:${focusSelection ? 'selected' : 'default'}`}
            hit={featured}
            position={getFactHitPosition(featured, featuredIndex + 1)}
            sendEvent={sendEvent}
            focusOnMount={focusSelection}
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
                  <button type="button" onClick={() => onSelect(hit.objectID)}>
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

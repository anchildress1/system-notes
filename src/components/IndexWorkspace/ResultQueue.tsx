'use client';

import { useMemo, useState } from 'react';
import type { Hit } from 'instantsearch.js';
import FactCard from '@/components/FactCard/FactCard';
import { formatNoteDate, getFactHitPosition, getNoteProjects } from '@/lib/noteContent';
import type { FactHitRecord, SendEventForHits } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

interface ResultQueueProps {
  items: Hit<FactHitRecord>[];
  nbHits: number;
  resultKey: string;
  sendEvent: SendEventForHits;
}

export default function ResultQueue({
  items,
  nbHits,
  resultKey,
  sendEvent,
}: Readonly<ResultQueueProps>) {
  const [promotion, setPromotion] = useState<{
    id: string;
    resultKey: string;
  } | null>(null);
  const pinnedId = promotion?.resultKey === resultKey ? promotion.id : null;
  const orderedItems = useMemo(() => {
    if (!pinnedId) return items;
    const pinned = items.find((item) => item.objectID === pinnedId);
    return pinned ? [pinned, ...items.filter((item) => item.objectID !== pinnedId)] : items;
  }, [items, pinnedId]);
  const featured = orderedItems[0];

  if (!featured) return null;

  return (
    <section className={styles.results} aria-label="Notes results">
      <h2 className="visually-hidden">Matching notes</h2>
      <p className={styles.queueStatus}>
        showing {orderedItems.length.toLocaleString()} of {nbHits.toLocaleString()} matching notes
      </p>

      <div className={styles.readingQueue}>
        <FactCard
          key={featured.objectID}
          hit={featured}
          position={getFactHitPosition(featured, 1)}
          sendEvent={sendEvent}
          focusOnMount={pinnedId === featured.objectID}
        />

        {orderedItems.length > 1 ? (
          <ol className={styles.queueList}>
            {orderedItems.slice(1).map((hit, index) => {
              const position = getFactHitPosition(hit, index + 2);
              const project = getNoteProjects(hit)[0] ?? 'System Notes';
              const date = formatNoteDate(hit.created_at);
              return (
                <li key={hit.objectID}>
                  <button
                    type="button"
                    onClick={() => setPromotion({ id: hit.objectID, resultKey })}
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
        The newest matches read here. Search, filter, or choose a row to bring a note up top.
      </p>
    </section>
  );
}

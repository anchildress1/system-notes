'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Hit } from 'instantsearch.js';
import FactCard from '@/components/FactCard/FactCard';
import { formatNoteDate, getFactHitPosition, getNoteProjects } from '@/lib/noteContent';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

/* Alternates shown per page. The reader above holds the featured note, so a page
   is one note plus five.

   Five, not ten: .queueTitle scales the type down by rank and floors at 1.05rem,
   which rank 5 reaches. */
const PAGE_SIZE = 5;

interface ResultQueueProps {
  items: Hit<FactHitRecord>[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function ResultQueue({ items, selectedId, onSelect }: Readonly<ResultQueueProps>) {
  const readerRef = useRef<HTMLDivElement>(null);
  const shouldFocusReader = useRef(false);
  const [pager, setPager] = useState({ page: 0, signature: '' });
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  /** Which end control moved the page, so focus can be rescued if it retires. */
  const pressedEnd = useRef<'previous' | 'next' | null>(null);
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

  // Paging to the last page disables the very control that got you there, and a
  // disabled element cannot hold focus — the browser drops it to <body>, which
  // returns a keyboard reader to the top of the document mid-task. Focus moves
  // to the opposite end instead, which is always live: a pager only renders
  // when there is more than one page, so the two ends are never both retired.
  // A layout effect, not a passive one, so the rescue lands before the paint it's racing.
  useLayoutEffect(() => {
    const pressed = pressedEnd.current;
    if (!pressed) return;
    pressedEnd.current = null;
    const source = pressed === 'previous' ? previousRef.current : nextRef.current;
    if (!source?.disabled) return;
    (pressed === 'previous' ? nextRef.current : previousRef.current)?.focus();
  }, [pager]);

  // A new result set starts at its own first page. The page is stored WITH the set it
  // was chosen for and read back only when the two still agree, so a stale page is
  // ignored rather than corrected.
  const resultSignature = JSON.stringify(items.map((item) => item.objectID));
  const requestedPage = pager.signature === resultSignature ? pager.page : 0;

  if (!featured) return null;

  const alternatives = items
    .map((hit, index) => ({ hit, index }))
    .filter(({ hit }) => hit.objectID !== featured.objectID);
  const pageCount = Math.max(1, Math.ceil(alternatives.length / PAGE_SIZE));
  // Clamped on read, not corrected in state: selecting a note on the last page
  // removes it from the alternates and can retire that page mid-render.
  const currentPage = Math.min(requestedPage, pageCount - 1);
  const goToPage = (next: number) => setPager({ page: next, signature: resultSignature });
  const pageStart = currentPage * PAGE_SIZE;
  const visible = alternatives.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <section aria-label="Notes results">
      <h2 className="visually-hidden">Matching notes</h2>
      <div className={styles.readingQueue}>
        {/* No aria-live here. Choosing a note already moves focus to this element,
            which announces it; the live region announced it a second time, and
            aria-atomic re-read the whole card — title, fact, project, date, tags
            and actions — on every keystroke that changed the top hit. */}
        <div
          ref={readerRef}
          className={styles.reader}
          tabIndex={-1}
          aria-label={`Now reading: ${featured.title}`}
        >
          <FactCard
            key={featured.objectID}
            hit={featured}
            position={getFactHitPosition(featured, featuredIndex + 1)}
          />
        </div>

        {visible.length > 0 ? (
          <ol
            className={styles.queueList}
            data-ranked-queue
            aria-label="Highest-ranked alternate notes"
          >
            {visible.map(({ hit, index }, rank) => {
              const position = getFactHitPosition(hit, index + 1);
              const project = getNoteProjects(hit)[0] ?? 'System Notes';
              const date = formatNoteDate(hit.created_at);
              return (
                <li key={hit.objectID} style={{ '--rank': rank } as CSSProperties}>
                  <button
                    type="button"
                    className="washed"
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

      {pageCount > 1 ? (
        <nav className={styles.queuePager} aria-label="Alternate notes pages">
          <button
            type="button"
            ref={previousRef}
            className={styles.queuePagerButton}
            data-variant="outline"
            disabled={currentPage === 0}
            onClick={() => {
              pressedEnd.current = 'previous';
              goToPage(currentPage - 1);
            }}
          >
            Previous
          </button>
          <button
            type="button"
            ref={nextRef}
            className={styles.queuePagerButton}
            data-variant="outline"
            disabled={currentPage >= pageCount - 1}
            onClick={() => {
              pressedEnd.current = 'next';
              goToPage(currentPage + 1);
            }}
          >
            Next
          </button>
          <p className={styles.queuePagerStatus} aria-live="polite">
            Page {currentPage + 1} of {pageCount}
          </p>
        </nav>
      ) : null}
    </section>
  );
}

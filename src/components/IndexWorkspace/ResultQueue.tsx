'use client';

import { useLayoutEffect, useRef } from 'react';
import type { Hit } from 'instantsearch.js';
import FactCard from '@/components/FactCard/FactCard';
import { formatNoteDate, getFactHitPosition, getNoteProjects } from '@/lib/noteContent';
import type { FactHitRecord } from '@/types/algolia';
import styles from './IndexWorkspace.module.css';

/* Rows per page. Six rather than five because the note being read is no longer
   lifted out of the list into a reader above it — a page carries the same six
   notes it always carried, all of them as rows. */
const PAGE_SIZE = 6;

interface ResultQueueProps {
  items: Hit<FactHitRecord>[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /* Paging opens a note without reporting a result click: pressing Next is
     navigation, not a reader picking that note out of the ranking, and an
     insights click event fired from it would be a signal nobody sent. */
  onReveal: (id: string) => void;
}

export default function ResultQueue({
  items,
  selectedId,
  onSelect,
  onReveal,
}: Readonly<ResultQueueProps>) {
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  /** Which end control moved the page, so focus can be rescued if it retires. */
  const pressedEnd = useRef<'previous' | 'next' | null>(null);

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
  }, [selectedId]);

  if (items.length === 0) return null;

  // A stale or absent selection falls back to the top-ranked note rather than
  // leaving a list of rows with nothing open in it.
  const openIndex = Math.max(
    items.findIndex((item) => item.objectID === selectedId),
    0
  );
  const openId = items[openIndex]!.objectID;
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // THE SELECTION IS THE PAGE. The page is derived from the open note and never
  // stored, so the two cannot disagree — and the rail's board, which selects by
  // rank, brings the queue with it for free. Holding a chosen page alongside the
  // selection is what let Next land on six rows with nothing open on them.
  const currentPage = Math.floor(openIndex / PAGE_SIZE);
  // Paging therefore moves the reader: it opens the first note of the page it
  // lands on, which is the only thing that can be open there.
  const goToPage = (next: number) => onReveal(items[next * PAGE_SIZE]!.objectID);
  const pageStart = currentPage * PAGE_SIZE;
  const visible = items.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <section aria-label="Notes results">
      <h2 className="visually-hidden">Matching notes</h2>
      {/* No aria-live. The open row is the one the reader just activated, with
          focus still on its own control, so a live region only re-read the whole
          note — title, fact, project, date, tags and actions — on every keystroke
          that changed the top hit. Measured, not assumed. */}
      <ol className={styles.queueList} data-ranked-queue aria-label="Ranked notes">
        {visible.map((hit, offset) => {
          const index = pageStart + offset;
          const open = hit.objectID === openId;
          const position = getFactHitPosition(hit, index + 1);
          const project = getNoteProjects(hit)[0] ?? 'System Notes';
          const date = formatNoteDate(hit.created_at);
          const panelId = `note-${hit.objectID}`;
          const titleId = `note-title-${hit.objectID}`;
          return (
            <li key={hit.objectID} data-open={open || undefined}>
              {/* The row's own label is the note's heading, so the opened note
                  does not restate it. A heading rather than a bare button: the
                  list is the document outline of the results. */}
              <h3 className={styles.queueHeading}>
                <button
                  type="button"
                  className="washed"
                  // Names the button, and so the heading, from the title alone.
                  // From its contents every heading read ordinal-project-date
                  // first and the rotor became identical prefixes.
                  aria-labelledby={titleId}
                  aria-expanded={open}
                  // Only while the panel exists. A dangling aria-controls names
                  // an id that is not in the document.
                  aria-controls={open ? panelId : undefined}
                  // One note is open, so this control cannot collapse it. Unsaid,
                  // it announces expanded and ignores Enter. Re-selecting also
                  // re-sent the insights click.
                  aria-disabled={open || undefined}
                  onClick={() => {
                    if (!open) onSelect(hit.objectID);
                  }}
                >
                  <span className={styles.queueMeta}>
                    <span>
                      № {position} · {project}
                      {date ? ` · ${date}` : ''}
                    </span>
                    <span>{hit.category || 'Note'}</span>
                  </span>
                  <span className={styles.queueTitle} id={titleId}>
                    {hit.title}
                  </span>
                </button>
              </h3>
              {open ? <FactCard hit={hit} id={panelId} labelledBy={titleId} /> : null}
            </li>
          );
        })}
      </ol>

      {pageCount > 1 ? (
        <nav className={styles.queuePager} aria-label="Ranked notes pages">
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

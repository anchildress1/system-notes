'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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
}

export default function ResultQueue({ items, selectedId, onSelect }: Readonly<ResultQueueProps>) {
  const [pager, setPager] = useState({ page: 0, signature: '', selection: '' });
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
  }, [pager]);

  if (items.length === 0) return null;

  // A stale or absent selection falls back to the top-ranked note rather than
  // leaving a list of rows with nothing open in it.
  const openIndex = Math.max(
    items.findIndex((item) => item.objectID === selectedId),
    0
  );
  const openId = items[openIndex]!.objectID;
  const resultSignature = JSON.stringify(items.map((item) => item.objectID));
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // A note opens where it sits, so the open row has to be on the page in view —
  // and the board in the rail can select a note hundreds of ranks down. The page
  // therefore follows the selection, and a page chosen by hand is remembered
  // against BOTH the result set and the selection it was chosen under. Either
  // one changing hands the page back to wherever the open row now is, rather
  // than leaving a page with nothing open on it.
  // No clamp: a held page is only read back while the result set is byte-identical
  // to the one it was chosen under, so it cannot outlive the page it names.
  const currentPage =
    pager.signature === resultSignature && pager.selection === (selectedId ?? '')
      ? pager.page
      : Math.floor(openIndex / PAGE_SIZE);
  const goToPage = (next: number) =>
    setPager({ page: next, signature: resultSignature, selection: selectedId ?? '' });
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
                  aria-expanded={open}
                  // Only while the panel exists. A dangling aria-controls names
                  // an id that is not in the document.
                  aria-controls={open ? panelId : undefined}
                  onClick={() => onSelect(hit.objectID)}
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

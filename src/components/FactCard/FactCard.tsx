'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Hit } from 'instantsearch.js';
import { FiArrowUpRight, FiRotateCcw } from 'react-icons/fi';
import { formatNoteDate, getNoteBody, getNoteProjects, getNoteTags } from '@/lib/noteContent';
import { getSafeHostname, isSafeExternalUrl } from '@/lib/urlSafety';
import type { FactHitRecord, SendEventForHits } from '@/types/algolia';
import styles from './FactCard.module.css';

interface FactCardProps {
  hit: Hit<FactHitRecord>;
  sendEvent?: SendEventForHits;
  position?: number;
  focusOnMount?: boolean;
}

export default function FactCard({
  hit,
  sendEvent,
  position = 1,
  focusOnMount = false,
}: Readonly<FactCardProps>) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasTrackedOpen = useRef(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);
  const shouldFocusOnMount = useRef(focusOnMount);
  const sourceUrl = isSafeExternalUrl(hit.url) ? hit.url : undefined;
  const sourceHost = getSafeHostname(sourceUrl);
  const body = getNoteBody(hit);
  const tags = useMemo(() => getNoteTags(hit), [hit]);
  const projects = useMemo(() => getNoteProjects(hit), [hit]);
  const date = formatNoteDate(hit.created_at);

  const close = useCallback(() => setIsFlipped(false), []);
  const open = useCallback(() => {
    setIsFlipped(true);
    if (!hasTrackedOpen.current && sendEvent) {
      sendEvent('click', hit, 'Note Opened');
      hasTrackedOpen.current = true;
    }
  }, [hit, sendEvent]);

  useEffect(() => {
    const target = isFlipped
      ? closeButtonRef
      : shouldRestoreFocus.current || shouldFocusOnMount.current
        ? openButtonRef
        : null;
    shouldRestoreFocus.current = isFlipped;
    shouldFocusOnMount.current = false;
    if (!target) return;

    let framesRemaining = 10;
    let frame: number;
    const focusVisibleFace = () => {
      const element = target.current;
      if (!element) return;
      if (globalThis.getComputedStyle(element).visibility === 'visible') {
        element.focus();
        return;
      }
      framesRemaining -= 1;
      if (framesRemaining > 0) frame = globalThis.requestAnimationFrame(focusVisibleFace);
    };
    frame = globalThis.requestAnimationFrame(focusVisibleFace);
    return () => globalThis.cancelAnimationFrame(frame);
  }, [isFlipped]);

  useEffect(() => {
    if (!isFlipped) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    globalThis.addEventListener('keydown', onEscape);
    return () => globalThis.removeEventListener('keydown', onEscape);
  }, [close, isFlipped]);

  return (
    <article
      id={`note-${hit.objectID}`}
      className={styles.card}
      data-state={isFlipped ? 'expanded' : 'collapsed'}
    >
      <div className={styles.flipper}>
        <div className={styles.front} aria-hidden={isFlipped}>
          <button
            ref={openButtonRef}
            className={styles.openButton}
            type="button"
            onClick={open}
            aria-expanded={isFlipped}
            aria-label={`Open note: ${hit.title}`}
            tabIndex={isFlipped ? -1 : 0}
          />
          <div className={styles.cardMeta}>
            <span>
              № {String(position).padStart(2, '0')} · {projects[0] || 'System Notes'}
              {date ? ` · ${date}` : ''}
            </span>
            <span className={styles.category}>{hit.category || 'Note'}</span>
          </div>
          <h3 className={styles.title}>{hit.title}</h3>
          <p className={styles.summary}>{hit.blurb || body}</p>
          {tags.length > 0 ? (
            <ul className={styles.frontTags} aria-label="Topics">
              {tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={styles.back} aria-hidden={!isFlipped}>
          <div className={styles.backHeader}>
            <span>Full note</span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label={`Close note: ${hit.title}`}
              tabIndex={isFlipped ? 0 : -1}
            >
              <FiRotateCcw aria-hidden="true" />
            </button>
          </div>
          <div
            className={styles.backScroll}
            tabIndex={isFlipped ? 0 : -1}
            aria-label="Full note content"
          >
            <h3>{hit.title}</h3>
            <p>{body}</p>
            <dl className={styles.noteData}>
              {date ? (
                <div>
                  <dt>Date</dt>
                  <dd>{date}</dd>
                </div>
              ) : null}
              {projects.length > 0 ? (
                <div>
                  <dt>Projects</dt>
                  <dd>{projects.join(', ')}</dd>
                </div>
              ) : null}
            </dl>
            {tags.length > 0 ? (
              <ul className={styles.tags} aria-label="Topics">
                {tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={styles.backActions}>
            <Link
              href={`/notes/${encodeURIComponent(hit.objectID)}`}
              prefetch={false}
              tabIndex={isFlipped ? 0 : -1}
            >
              Permalink <FiArrowUpRight aria-hidden="true" />
            </Link>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isFlipped ? 0 : -1}
              >
                {sourceHost === 'dev.to' ? 'Read on DEV' : 'View source'}
                <FiArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

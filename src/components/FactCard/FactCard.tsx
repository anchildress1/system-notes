'use client';

import { useMemo } from 'react';
import type { Hit } from 'instantsearch.js';
import { FiArrowUpRight } from 'react-icons/fi';
import { formatNoteDate, getNoteBody, getNoteProjects, getNoteTags } from '@/lib/noteContent';
import { getSafeHostname, isSafeExternalUrl } from '@/lib/urlSafety';
import type { FactHitRecord } from '@/types/algolia';
import styles from './FactCard.module.css';

interface FactCardProps {
  hit: Hit<FactHitRecord>;
  position?: number;
}

export default function FactCard({ hit, position = 1 }: Readonly<FactCardProps>) {
  const sourceUrl = isSafeExternalUrl(hit.url) ? hit.url : undefined;
  const sourceHost = getSafeHostname(sourceUrl);
  const fact = hit.fact.trim() || getNoteBody(hit);
  const tags = useMemo(() => getNoteTags(hit), [hit]);
  const projects = useMemo(() => getNoteProjects(hit), [hit]);
  const date = formatNoteDate(hit.created_at);

  return (
    <article id={`note-${hit.objectID}`} className={styles.card}>
      <div className={styles.cardMeta}>
        <span>
          № {String(position).padStart(2, '0')} · {projects[0] || 'System Notes'}
          {date ? ` · ${date}` : ''}
        </span>
        <span className={styles.category}>{hit.category || 'Note'}</span>
      </div>

      <h3 className={styles.title}>{hit.title}</h3>

      <div className={styles.factBlock}>
        <p className={styles.factLabel}>Fact</p>
        <p className={styles.fact}>{fact}</p>
      </div>

      {projects.length > 1 ? (
        <dl className={styles.noteData}>
          <div>
            <dt>Projects</dt>
            <dd>{projects.join(', ')}</dd>
          </div>
        </dl>
      ) : null}

      {tags.length > 0 ? (
        <ul className={styles.tags} aria-label="Topics">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}

      <div className={styles.actions}>
        {sourceUrl ? (
          <a className="marked-hover" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {sourceHost === 'dev.to' ? 'Read on DEV' : 'View source'}
            <FiArrowUpRight aria-hidden="true" />
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

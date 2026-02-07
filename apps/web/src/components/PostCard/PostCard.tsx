'use client';

import { Highlight } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';
import styles from './PostCard.module.css';

export interface PostHitRecord {
  objectID: string;
  title: string;
  url: string;
  blurb: string;
  fact: string; // Excerpt
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  category: string;
  _highlightResult?: Record<string, unknown>;
}

interface PostCardProps {
  hit: Hit<PostHitRecord>;
  sendEvent?: SendEventForHits;
}

export default function PostCard({ hit, sendEvent }: PostCardProps) {
  // Use explicit url if available, fallback to blurb if it looks like a URL, then objectID
  const url = hit.url || (hit.blurb && hit.blurb.startsWith('http') ? hit.blurb : hit.objectID);
  const tags = hit['tags.lvl1'] || hit['tags.lvl0'] || [];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      aria-label={`Read post: ${hit.title}`}
      onClick={() => {
        if (sendEvent) {
          sendEvent('click', hit, 'Post Clicked', {
            objectIDs: [hit.objectID],
          });
        }
      }}
    >
      <div className={styles.cardInner}>
        <div className={styles.header}>
          <span className={styles.category}>{hit.category}</span>
        </div>

        <h3 className={styles.title}>
          <Highlight attribute="title" hit={hit} />
        </h3>

        <p className={styles.excerpt}>
          <Highlight attribute="fact" hit={hit} />
        </p>

        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.readMore}>Read Post &rarr;</span>
        </div>
      </div>
    </a>
  );
}

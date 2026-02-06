'use client';

import { useState, useCallback, useRef } from 'react';
import { Highlight } from 'react-instantsearch';
import type { Hit, BaseHit } from 'instantsearch.js';
import type { SendEventForHits } from 'instantsearch.js/es/lib/utils';
import styles from './FactCard.module.css';

interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  tags: string[];
  projects: string[];
  category: string;
  signal: number;
}

interface FactCardProps {
  hit: Hit<FactHitRecord>;
  sendEvent?: SendEventForHits;
}

export default function FactCard({ hit, sendEvent }: FactCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasTrackedFlip = useRef(false);
  const categoryLabel = hit.category || '';

  const handleFlip = useCallback(() => {
    const newFlipState = !isFlipped;
    setIsFlipped(newFlipState);

    if (newFlipState && !hasTrackedFlip.current && sendEvent) {
      hasTrackedFlip.current = true;
      sendEvent('click', hit, 'Fact Card Viewed', {
        objectIDs: [hit.objectID],
      });
    }
  }, [isFlipped, sendEvent, hit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip]
  );

  return (
    <article
      className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${hit.title}. ${isFlipped ? 'Press to show summary' : 'Press to show full fact'}`}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardFront} aria-hidden={isFlipped}>
          <div className={styles.header}>
            <span className={styles.domain}>{categoryLabel}</span>
          </div>

          <h3 className={styles.title}>
            <Highlight attribute="title" hit={hit} />
          </h3>

          <p className={styles.blurb}>
            <Highlight attribute="blurb" hit={hit} />
          </p>

          {hit.projects && hit.projects.length > 0 && (
            <div className={styles.entities}>
              {hit.projects.slice(0, 3).map((entity) => (
                <span key={entity} className={styles.entity}>
                  {entity}
                </span>
              ))}
              {hit.projects.length > 3 && (
                <span className={styles.entityMore}>+{hit.projects.length - 3}</span>
              )}
            </div>
          )}

          <div className={styles.flipHint}>
            <span className={styles.flipIcon} aria-hidden="true">
              ↻
            </span>
            <span className={styles.flipText}>Click to read more</span>
          </div>
        </div>

        <div className={styles.cardBack} aria-hidden={!isFlipped}>
          <div className={styles.factContent}>
            <p className={styles.factText}>{hit.fact}</p>
          </div>

          {hit.tags && hit.tags.length > 0 && (
            <div className={styles.tags}>
              {hit.tags.slice(0, 5).map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
              {hit.tags.length > 5 && (
                <span className={styles.tagMore}>+{hit.tags.length - 5}</span>
              )}
            </div>
          )}

          <div className={styles.flipHint}>
            <span className={styles.flipIcon} aria-hidden="true">
              ↻
            </span>
            <span className={styles.flipText}>Click to go back</span>
          </div>
        </div>
      </div>
    </article>
  );
}

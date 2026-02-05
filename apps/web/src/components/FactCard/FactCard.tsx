'use client';

import { useState, useCallback } from 'react';
import { Highlight } from 'react-instantsearch';
import type { Hit, BaseHit } from 'instantsearch.js';
import styles from './FactCard.module.css';

interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  tags: string[];
  entities: string[];
  domain: string;
  signal_level: number;
}

interface FactCardProps {
  hit: Hit<FactHitRecord>;
}

export default function FactCard({ hit }: FactCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const domainLabel = hit.domain?.replace(/_/g, ' ') || '';

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

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
      role="button"
      aria-expanded={isFlipped}
      aria-label={`${hit.title}. ${isFlipped ? 'Press to show summary' : 'Press to show full fact'}`}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardFront} aria-hidden={isFlipped}>
          <div className={styles.header}>
            <span className={styles.domain}>{domainLabel}</span>
          </div>

          <h3 className={styles.title}>
            <Highlight attribute="title" hit={hit} />
          </h3>

          <p className={styles.blurb}>
            <Highlight attribute="blurb" hit={hit} />
          </p>

          {hit.entities && hit.entities.length > 0 && (
            <div className={styles.entities}>
              {hit.entities.slice(0, 3).map((entity) => (
                <span key={entity} className={styles.entity}>
                  {entity}
                </span>
              ))}
              {hit.entities.length > 3 && (
                <span className={styles.entityMore}>+{hit.entities.length - 3}</span>
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

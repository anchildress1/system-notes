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
  projects: string[];
  category: string;
  signal: number;
}

interface FactCardProps {
  hit: Hit<FactHitRecord>;
}

export default function FactCard({ hit }: FactCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const categoryLabel = hit.category || '';

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isFlipped) {
        e.preventDefault();
        setIsFlipped(false);
      }
    },
    [isFlipped]
  );

  return (
    <>
      {isFlipped && <div className={styles.placeholder} aria-hidden="true" />}
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        onKeyDown={handleContainerKeyDown}
        data-state={isFlipped ? 'expanded' : 'collapsed'}
      >
        <div className={styles.cardInner}>
          <button
            type="button"
            className={styles.cardFront}
            onClick={handleFlip}
            aria-expanded={isFlipped}
            aria-label={`${hit.title}. Press to expand.`}
            hidden={isFlipped}
          >
            <div className={styles.header}>
              <span className={styles.domain}>{categoryLabel}</span>
            </div>

            <h3 className={styles.title}>
              <Highlight attribute="title" hit={hit} />
            </h3>

            <p className={styles.blurb}>
              <Highlight attribute="blurb" hit={hit} />
            </p>

            <div className={styles.flipHint}>
              <span className={styles.flipIcon} aria-hidden="true">
                +
              </span>
              <span className={styles.flipText}>Expand</span>
            </div>
          </button>

          <div
            className={styles.cardBack}
            aria-hidden={!isFlipped}
            role="region"
            aria-label={`${hit.title} details`}
          >
            <div className={styles.backHeader}>
              <h3 className={styles.backTitle}>{hit.title}</h3>
              <button
                type="button"
                className={styles.closeHint}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                aria-label="Close expanded view"
                tabIndex={isFlipped ? 0 : -1}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={isFlipped}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className={styles.factContent}>
              <blockquote className={styles.factQuote}>&ldquo;{hit.fact}&rdquo;</blockquote>
            </div>

            <div className={styles.metaSection}>
              {hit.projects && hit.projects.length > 0 && (
                <div className={styles.facetGroup}>
                  <span className={styles.facetLabel}>Projects</span>
                  <div className={styles.entities}>
                    {hit.projects.map((entity) => (
                      <span key={entity} className={styles.entity}>
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hit.tags && hit.tags.length > 0 && (
                <div className={styles.facetGroup}>
                  <span className={styles.facetLabel}>Tags</span>
                  <div className={styles.tags}>
                    {hit.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isFlipped && (
        <div className={styles.backdrop} onClick={() => setIsFlipped(false)} aria-hidden="true" />
      )}
    </>
  );
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Highlight } from 'react-instantsearch';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hit, BaseHit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';
import styles from './FactCard.module.css';

export interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  content?: string;
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  projects: string[];
  category: string;
  signal: number;
  url?: string;
}

interface FactCardProps {
  hit: Hit<FactHitRecord>;
  sendEvent?: SendEventForHits;
}

export default function FactCard({ hit, sendEvent }: FactCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const hasTrackedFlip = useRef(false);
  const categoryLabel = hit.category || 'System';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFlipped) {
        e.preventDefault();
        setIsFlipped(false);
      }
    };

    if (isFlipped) {
      window.addEventListener('keydown', handleWindowKeyDown);
    }
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isFlipped]);

  const handleFlip = useCallback(() => {
    if (!isFlipped && !hasTrackedFlip.current && sendEvent) {
      hasTrackedFlip.current = true;
      sendEvent('click', hit, 'Fact Card Viewed', {
        objectIDs: [hit.objectID],
      });
    }
    setIsFlipped((prev) => !prev);
  }, [isFlipped, sendEvent, hit]);

  // Access hierarchical tags using bracket notation
  const lvl1Tags = hit['tags.lvl1'] || [];
  const displayTags = lvl1Tags.slice(0, 1); // Show only the first lvl1 tag

  return (
    <>
      {/* Front Face - Always rendered in list, but hidden when flipped using layoutId */}
      <motion.div
        layoutId={`card-${hit.objectID}`}
        className={`${styles.card} ${isFlipped ? styles.flippedVisible : ''}`}
        onClick={handleFlip}
        data-state={isFlipped ? 'expanded' : 'collapsed'}
        role="button"
        tabIndex={0}
        aria-expanded={isFlipped}
        aria-label={`${hit.title}. Press to expand.`}
        style={{ opacity: isFlipped ? 0 : 1 }}
      >
        <div className={styles.cardInner}>
          <div className={styles.cardFront}>
            <div className={styles.content}>
              <div className={styles.header}>
                <div className={styles.headerTop}>
                  {/* Removed ownerBadge (Category) from here */}

                  {hit.url && (
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.ghLink}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(hit.url, '_blank', 'noopener,noreferrer');
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' || e.key === ' ') {
                          window.open(hit.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      aria-label={`View source for ${hit.title}`}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    </div>
                  )}
                </div>
                <h2 className={styles.title}>
                  <Highlight attribute="title" hit={hit} />
                </h2>
              </div>

              <p className={styles.description}>
                {hit.blurb ? (
                  <Highlight attribute="blurb" hit={hit} />
                ) : (
                  (hit.content || hit.fact || '').substring(0, 100) + '...'
                )}
              </p>

              <div className={styles.simpleTags}>
                <span className={styles.tagCategory}>{categoryLabel}</span>
                {displayTags.map((t) => (
                  <span key={t} className={styles.tagLevel1}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded / Flipped View */}
      <AnimatePresence mode="wait">
        {isFlipped && portalTarget && (
          <>
            {createPortal(
              <motion.div
                className={styles.backdrop}
                onClick={() => setIsFlipped(false)}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />,
              portalTarget
            )}
            {createPortal(
              <motion.div
                layoutId={`card-${hit.objectID}`}
                className={`${styles.card} ${styles.flipped}`}
                role="dialog"
                aria-modal="true"
                initial={{ rotateY: -180, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: 180, opacity: 0, scale: 0.8 }}
                transition={{
                  layout: { duration: 0.5, type: 'spring', bounce: 0.2 },
                  rotateY: { duration: 0.5 },
                  opacity: { duration: 0.3 },
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={styles.cardInner}>
                  <div
                    className={styles.cardBack}
                    aria-hidden={!isFlipped}
                    role="region"
                    aria-label={`${hit.title} details`}
                  >
                    <button
                      type="button"
                      className={styles.closeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(false);
                      }}
                      aria-label="Close expanded view"
                      tabIndex={0}
                      autoFocus
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>

                    <div className={styles.backHeader}>
                      <div className={styles.headerTop}>
                        {/* Removed Category Label */}

                        <div className={styles.headerControls}>
                          {hit.url && (
                            <a
                              href={hit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.ghLink}
                              aria-label={`View source for ${hit.title}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                      <h3 className={styles.title} style={{ marginTop: '0.5rem' }}>
                        {hit.title}
                      </h3>
                    </div>

                    <div className={styles.factContent}>
                      <p className={styles.factText}>{hit.fact}</p>
                    </div>

                    <div className={styles.metaSection}>
                      {hit.projects && hit.projects.length > 0 && (
                        <div className={styles.facetGroup}>
                          <div className={styles.simpleTags}>
                            {hit.projects.map((entity) => (
                              <span key={entity} className={styles.simpleTag}>
                                {entity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>,
              portalTarget
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

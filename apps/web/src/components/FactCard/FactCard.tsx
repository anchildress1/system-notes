'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Highlight } from 'react-instantsearch';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalTarget = useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);
  const hasTrackedFlip = useRef(false);
  const categoryLabel = hit.category || 'System';
  const dialogTitleId = `fact-card-title-${hit.objectID}`;
  const dialogDescriptionId = `fact-card-description-${hit.objectID}`;
  const tagsLvl0Raw = hit['tags.lvl0'];
  const tagsLvl1Raw = hit['tags.lvl1'];
  const tagsLvl0 = useMemo(() => tagsLvl0Raw || [], [tagsLvl0Raw]);
  const tagsLvl1 = useMemo(() => tagsLvl1Raw || [], [tagsLvl1Raw]);

  const isFlipped = searchParams.get('factId') === hit.objectID;

  const applyHitParams = useCallback(
    (params: URLSearchParams) => {
      if (!params.has('category') && hit.category) {
        params.append('category', hit.category);
      }

      if (!params.has('project') && hit.projects?.length) {
        hit.projects.forEach((project) => params.append('project', project));
      }

      if (!params.has('tag0') && tagsLvl0.length) {
        tagsLvl0.forEach((tag) => params.append('tag0', tag));
      }

      if (!params.has('tag1') && tagsLvl1.length) {
        tagsLvl1.forEach((tag) => params.append('tag1', tag));
      }
    },
    [hit.category, hit.projects, tagsLvl0, tagsLvl1]
  );

  const openCard = useCallback(() => {
    if (!hasTrackedFlip.current && sendEvent) {
      hasTrackedFlip.current = true;
      sendEvent('click', hit, 'Fact Card Viewed', {
        objectIDs: [hit.objectID],
      });
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('factId', hit.objectID);
    applyHitParams(params);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [sendEvent, hit, searchParams, router, applyHitParams]);

  const closeCard = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('factId');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFlipped) {
        e.preventDefault();
        closeCard();
      }
    };

    if (isFlipped) {
      window.addEventListener('keydown', handleWindowKeyDown);
    }
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isFlipped, closeCard]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isFlipped) {
        closeCard();
      } else {
        openCard();
      }
    },
    [isFlipped, openCard, closeCard]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isFlipped) {
          closeCard();
        } else {
          openCard();
        }
      }
    },
    [isFlipped, openCard, closeCard]
  );

  const lvl1Tags = tagsLvl1;
  const displayTags = lvl1Tags.slice(0, 1);
  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('factId', hit.objectID);

    if (hit.category) {
      params.append('category', hit.category);
    }

    if (hit.projects?.length) {
      hit.projects.forEach((project) => params.append('project', project));
    }

    tagsLvl0.forEach((tag) => params.append('tag0', tag));
    tagsLvl1.forEach((tag) => params.append('tag1', tag));

    return `/search?${params.toString()}`;
  }, [hit.objectID, hit.category, hit.projects, tagsLvl0, tagsLvl1]);

  return (
    <>
      <a
        href={cardUrl}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={styles.cardLink}
        aria-expanded={isFlipped}
        aria-label={`${hit.title}. Press to expand.`}
      >
        <motion.article
          layoutId={`card-${hit.objectID}`}
          className={`${styles.card} ${isFlipped ? styles.flippedVisible : ''}`}
          data-state={isFlipped ? 'expanded' : 'collapsed'}
        >
          <div className={styles.cardInner}>
            <div className={styles.cardFront}>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.headerTop}>
                    {hit.url && (
                      <span
                        role="button"
                        tabIndex={0}
                        className={styles.ghLink}
                        onClick={(e) => {
                          e.preventDefault();
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
                      </span>
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
        </motion.article>
      </a>

      <AnimatePresence mode="wait">
        {isFlipped && portalTarget && (
          <>
            {createPortal(
              <motion.div
                className={styles.backdrop}
                onClick={closeCard}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />,
              portalTarget
            )}
            {createPortal(
              <motion.article
                layoutId={`card-${hit.objectID}`}
                className={`${styles.card} ${styles.flipped}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                aria-describedby={dialogDescriptionId}
                initial={{ rotateY: 180, scale: 1 }}
                animate={{ rotateY: 0, scale: 1 }}
                exit={{ rotateY: -180, scale: 1 }}
                transition={{
                  rotateY: { duration: 0.2, ease: 'easeOut' },
                  scale: { duration: 0.15, ease: 'easeOut', delay: 0.2 },
                  layout: { duration: 0.15, ease: 'easeOut', delay: 0.2 },
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
                        closeCard();
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
                      <h3
                        id={dialogTitleId}
                        className={styles.title}
                        style={{ marginTop: '0.5rem' }}
                      >
                        {hit.title}
                      </h3>
                    </div>

                    <div className={styles.factContent}>
                      <p id={dialogDescriptionId} className={styles.factText}>
                        {hit.fact}
                      </p>
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
              </motion.article>,
              portalTarget
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

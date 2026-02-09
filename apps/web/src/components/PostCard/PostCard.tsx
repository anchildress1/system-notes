'use client';

import { useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Highlight } from 'react-instantsearch';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';
import styles from './PostCard.module.css';

export interface PostHitRecord {
  objectID: string;
  title: string;
  url: string;
  blurb: string;
  fact: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalTarget = useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);
  const hasTrackedFlip = useRef(false);
  const tags = hit['tags.lvl1'] || hit['tags.lvl0'] || [];
  const dialogTitleId = `post-card-title-${hit.objectID}`;
  const dialogDescriptionId = `post-card-description-${hit.objectID}`;

  const isFlipped = searchParams.get('factId') === hit.objectID;

  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('factId', hit.objectID);
    if (hit.category) params.append('category', hit.category);
    return `/search?${params.toString()}`;
  }, [hit.objectID, hit.category]);

  function openCard() {
    if (!hasTrackedFlip.current && sendEvent) {
      hasTrackedFlip.current = true;
      sendEvent('click', hit, 'Post Clicked', {
        objectIDs: [hit.objectID],
      });
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('factId', hit.objectID);
    if (hit.category) params.set('category', hit.category);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function closeCard() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('factId');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  }

  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isFlipped) {
      closeCard();
    } else {
      openCard();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isFlipped) {
        closeCard();
      } else {
        openCard();
      }
    }
  }

  return (
    <>
      <a
        href={cardUrl}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={styles.cardLink}
        aria-expanded={isFlipped}
        aria-label={`Read post: ${hit.title}`}
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
                initial={{ rotateY: 180, scale: 0.85, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                exit={{ rotateY: -180, scale: 0.85, opacity: 0 }}
                transition={{
                  rotateY: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] },
                  scale: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] },
                  opacity: { duration: 0.25 },
                  layout: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] },
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
                      <h3 id={dialogTitleId} className={styles.backTitle}>
                        {hit.title}
                      </h3>
                    </div>

                    <div className={styles.factContent}>
                      <p id={dialogDescriptionId} className={styles.factText}>
                        {hit.fact}
                      </p>
                    </div>

                    <div className={styles.metaSection}>
                      {tags.length > 0 && (
                        <div className={styles.tags}>
                          {tags.map((tag, i) => (
                            <span key={i} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
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

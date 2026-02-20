'use client';

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Highlight } from 'react-instantsearch';
import { motion } from 'framer-motion';
import type { Hit, BaseHit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import { GitHubIcon, DevIcon, CloseIcon } from '@/components/icons';
import { overlayTransition, cardFlipVariants } from '@/utils/animations';
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
  const portalTarget = useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);
  const hasTrackedFlip = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cardLinkRef = useRef<HTMLAnchorElement>(null);
  const categoryLabel = hit.category || 'System';
  const dialogTitleId = `fact-card-title-${hit.objectID}`;
  const dialogDescriptionId = `fact-card-description-${hit.objectID}`;
  const tagsLvl1Raw = hit['tags.lvl1'];
  const tagsLvl1 = useMemo(() => tagsLvl1Raw || [], [tagsLvl1Raw]);

  const [isFlipped, setIsFlipped] = useState(false);
  // Keep portal mounted during exit animation
  const [portalVisible, setPortalVisible] = useState(false);

  const openCard = useCallback(() => {
    if (!hasTrackedFlip.current && sendEvent) {
      hasTrackedFlip.current = true;
      sendEvent('click', hit, 'Fact Card Viewed');
    }
    setPortalVisible(true);
    setIsFlipped(true);
  }, [sendEvent, hit]);

  const closeCard = useCallback(() => {
    setIsFlipped(false);
  }, []);

  // Unmount portal after exit animation completes
  const handleExitComplete = useCallback(() => {
    if (!isFlipped) {
      setPortalVisible(false);
    }
  }, [isFlipped]);

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

  const shouldRestoreFocusRef = useRef(false);

  // Focus management: move focus to close button when dialog opens, return on close
  useEffect(() => {
    if (isFlipped) {
      // Wait for portal to render, then focus close button
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
        // Mark that focus was moved into the dialog so we can restore it on close
        shouldRestoreFocusRef.current = true;
      });
    } else if (cardLinkRef.current && shouldRestoreFocusRef.current) {
      // Return focus to card link when closing if focus was previously moved into the dialog
      shouldRestoreFocusRef.current = false;
      cardLinkRef.current.focus();
    }
  }, [isFlipped]);

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

  // Detect if this is a DEV.to blog post vs GitHub source
  const isDevPost = useMemo(() => hit.url?.includes('dev.to') ?? false, [hit.url]);

  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('factId', hit.objectID);
    return `/search?${params.toString()}`;
  }, [hit.objectID]);

  return (
    <>
      <a
        ref={cardLinkRef}
        href={cardUrl}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={styles.cardLink}
        aria-expanded={isFlipped}
        aria-label={`${hit.title}. Press to expand.`}
        tabIndex={isFlipped ? -1 : 0}
        aria-hidden={isFlipped}
      >
        <motion.article
          className={`${styles.card} ${isFlipped ? styles.flippedVisible : ''}`}
          data-state={isFlipped ? 'expanded' : 'collapsed'}
          aria-hidden={isFlipped}
        >
          <div className={styles.cardInner}>
            <div className={styles.cardFront}>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.headerTop}>
                    <span className="card-header-badge">{categoryLabel}</span>
                    {hit.url && (
                      <SourceLinkButton
                        url={hit.url}
                        label={
                          isDevPost
                            ? `Read ${hit.title} on DEV Community`
                            : `View source for ${hit.title}`
                        }
                        icon={isDevPost ? <DevIcon /> : <GitHubIcon />}
                      />
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

                <div className="simple-tags">
                  {displayTags.map((t) => (
                    <span key={t} className="simple-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      </a>

      {portalVisible &&
        portalTarget &&
        createPortal(
          <motion.div
            className={styles.overlay}
            onClick={closeCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFlipped ? 1 : 0 }}
            transition={overlayTransition}
          >
            <motion.article
              className={`${styles.card} ${styles.flipped}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              aria-describedby={dialogDescriptionId}
              onClick={(e) => e.stopPropagation()}
              variants={cardFlipVariants}
              initial="hidden"
              animate={isFlipped ? 'visible' : 'exit'}
              onAnimationComplete={(definition) => {
                if (definition === 'exit') handleExitComplete();
              }}
            >
              <div className={styles.cardInner}>
                <div
                  className={styles.cardBack}
                  aria-hidden={!isFlipped}
                  role="region"
                  aria-label={`${hit.title} details`}
                >
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className={`close-button-global ${styles.closeButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeCard();
                    }}
                    aria-label="Close expanded view"
                    tabIndex={0}
                  >
                    <CloseIcon />
                  </button>

                  <div className={styles.backHeader}>
                    <div className={styles.headerTop}>
                      <div className={styles.headerControls}>
                        {hit.url && (
                          <SourceLinkButton
                            url={hit.url}
                            label={
                              isDevPost
                                ? `Read ${hit.title} on DEV Community`
                                : `View source for ${hit.title}`
                            }
                            icon={isDevPost ? <DevIcon /> : <GitHubIcon />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                    <h3 id={dialogTitleId} className={styles.title} style={{ marginTop: '0.5rem' }}>
                      {hit.title}
                    </h3>
                  </div>

                  <div className={styles.factContent}>
                    <p id={dialogDescriptionId} className={styles.factText}>
                      {hit.content || hit.fact || hit.blurb}
                    </p>
                  </div>

                  <div className={styles.metaSection}>
                    {hit.projects && hit.projects.length > 0 && (
                      <div className={styles.facetGroup}>
                        <div className="simple-tags">
                          {hit.projects.map((entity) => (
                            <span key={entity} className="simple-tag">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          </motion.div>,
          portalTarget
        )}
    </>
  );
}

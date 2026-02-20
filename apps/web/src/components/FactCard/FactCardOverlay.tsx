'use client';

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { OverlayHit } from '@/hooks/useFactIdRouting';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import { GitHubIcon, DevIcon, CloseIcon } from '@/components/icons';
import { overlayTransition, cardFlipVariants } from '@/utils/animations';
import styles from './FactCard.module.css';

interface FactCardOverlayProps {
  hit: OverlayHit;
  onClose: () => void;
}

/**
 * Standalone overlay for displaying a fact card from a deep-link URL.
 * Renders the same expanded card view as FactCard's portal, but isn't
 * tied to a card in the search results list.
 */
export default function FactCardOverlay({ hit, onClose }: FactCardOverlayProps) {
  const portalTarget = useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const dialogTitleId = `overlay-title-${hit.objectID}`;
  const dialogDescriptionId = `overlay-desc-${hit.objectID}`;
  const isDevPost = useMemo(() => hit.url?.includes('dev.to') ?? false, [hit.url]);

  // Focus close button on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const handleExitComplete = useCallback(() => {
    if (!isVisible) onClose();
  }, [isVisible, onClose]);

  if (!portalTarget) return null;

  return createPortal(
    <motion.div
      className={styles.overlay}
      onClick={handleClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
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
        animate={isVisible ? 'visible' : 'exit'}
        onAnimationComplete={(definition) => {
          if (definition === 'exit') handleExitComplete();
        }}
      >
        <div className={styles.cardInner}>
          <div className={styles.cardBack} role="region" aria-label={`${hit.title} details`}>
            <button
              ref={closeButtonRef}
              type="button"
              className={`close-button-global ${styles.closeButton}`}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
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
  );
}

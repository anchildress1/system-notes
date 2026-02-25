'use client';

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { OverlayHit } from '@/hooks/useFactIdRouting';
import { overlayTransition, cardFlipVariants } from '@/utils/animations';
import FactCardBack from './FactCardBack';
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
export default function FactCardOverlay({ hit, onClose }: Readonly<FactCardOverlayProps>) {
  const portalTarget = useMemo(() => {
    /* v8 ignore next */
    if (typeof document === 'undefined') return null;
    return document.body;
  }, []);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const dialogTitleId = `overlay-title-${hit.objectID}`;
  const dialogDescriptionId = `overlay-desc-${hit.objectID}`;

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
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
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
          <FactCardBack
            hit={hit}
            onClose={handleClose}
            closeButtonRef={closeButtonRef}
            dialogTitleId={dialogTitleId}
            dialogDescriptionId={dialogDescriptionId}
          />
        </div>
      </motion.article>
    </motion.div>,
    portalTarget
  );
}

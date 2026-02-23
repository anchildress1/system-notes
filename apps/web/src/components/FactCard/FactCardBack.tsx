import { RefObject } from 'react';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import { GitHubIcon, DevIcon, CloseIcon } from '@/components/icons';
import styles from './FactCard.module.css';

export interface FactCardBackHit {
  objectID: string;
  title: string;
  blurb?: string;
  fact?: string;
  content?: string;
  projects: string[];
  url?: string;
}

interface FactCardBackProps {
  hit: FactCardBackHit;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  dialogTitleId: string;
  dialogDescriptionId: string;
  ariaHidden?: boolean;
}

export default function FactCardBack({
  hit,
  onClose,
  closeButtonRef,
  dialogTitleId,
  dialogDescriptionId,
  ariaHidden,
}: Readonly<FactCardBackProps>) {
  const isDevPost = hit.url?.includes('dev.to') ?? false;

  return (
    <section
      className={styles.cardBack}
      aria-hidden={ariaHidden}
      aria-label={`${hit.title} details`}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className={`close-button-global ${styles.closeButton}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
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
                  isDevPost ? `Read ${hit.title} on DEV Community` : `View source for ${hit.title}`
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
    </section>
  );
}

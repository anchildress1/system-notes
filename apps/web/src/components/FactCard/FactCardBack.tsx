import { RefObject, useMemo } from 'react';
import { CloseIcon, GitHubIcon, DevIcon } from '@/components/icons';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import styles from './FactCard.module.css';

export interface FactCardBackHit {
  objectID: string;
  title: string;
  blurb?: string;
  fact?: string;
  content?: string;
  url?: string;
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
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

  // Derive display tags from lvl1 leaf parts (Algolia format: "Parent > Child").
  // lvl1 already encodes the full hierarchy; lvl0 is redundant for display purposes.
  // Falls back to lvl0 category names when no lvl1 entries exist.
  const displayTags = useMemo(() => {
    const lvl1 = hit['tags.lvl1'] ?? [];
    if (lvl1.length > 0) {
      return lvl1.map((tag) => {
        const sepIdx = tag.indexOf(' > ');
        return sepIdx > -1 ? tag.slice(sepIdx + 3) : tag;
      });
    }
    return hit['tags.lvl0'] ?? [];
  }, [hit]);

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

      {hit.url && (
        <SourceLinkButton
          url={hit.url}
          label={isDevPost ? `Read ${hit.title} on DEV Community` : `View source for ${hit.title}`}
          icon={isDevPost ? <DevIcon /> : <GitHubIcon />}
        />
      )}

      <h3 id={dialogTitleId} className="visually-hidden">
        {hit.title}
      </h3>

      <div className={styles.factContent}>
        <p id={dialogDescriptionId} className={styles.factText}>
          {hit.content || hit.fact || hit.blurb}
        </p>
      </div>

      {displayTags.length > 0 && (
        <div className={styles.metaSection}>
          <div className={styles.facetGroup}>
            <span className={styles.facetLabel}>Topics</span>
            <div className="simple-tags">
              {displayTags.map((tag) => (
                <span key={tag} className="simple-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Highlight } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits, FactHitRecord } from '@/types/algolia';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import { GitHubIcon, DevIcon } from '@/components/icons';
import { getCardVariant } from './cardVariant';
import styles from './FactCard.module.css';

export type { FactHitRecord } from '@/types/algolia';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ISO timestamp ("2026-05-24T21:42:51Z") -> "May 2026"; null if unparseable.
function formatMonthYear(iso?: string): string | null {
  if (!iso) return null;
  const [year, month] = iso.slice(0, 10).split('-');
  const monthIndex = Number(month) - 1;
  if (
    !/^\d{4}$/.test(year ?? '') ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }
  return `${MONTHS[monthIndex]} ${year}`;
}

interface FactCardProps {
  hit: Hit<FactHitRecord>;
  sendEvent?: SendEventForHits;
  // 1-indexed position in the current rendered page; drives the size/accent cycle.
  // Falls back to hit.__position for direct rendering (e.g. tests, deep-links).
  position?: number;
}

export default function FactCard({ hit, sendEvent, position }: Readonly<FactCardProps>) {
  const hasTrackedFlip = useRef(false);
  const frontButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLDivElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const categoryLabel = hit.category || 'System';
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      if (next && !hasTrackedFlip.current && sendEvent) {
        hasTrackedFlip.current = true;
        sendEvent('click', hit, 'Fact Card Viewed');
      }
      return next;
    });
  }, [sendEvent, hit]);

  const closeFromBackKeyboard = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFlip();
      }
    },
    [toggleFlip]
  );

  useEffect(() => {
    if (!isFlipped) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFlipped(false);
      }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [isFlipped]);

  useEffect(() => {
    if (isFlipped) {
      const frame = requestAnimationFrame(() => {
        backButtonRef.current?.focus();
        shouldRestoreFocusRef.current = true;
      });
      return () => cancelAnimationFrame(frame);
    }

    if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      frontButtonRef.current?.focus();
    }
  }, [isFlipped]);

  const isDevPost = useMemo(() => hit.url?.includes('dev.to') ?? false, [hit.url]);

  const variantPosition = position ?? hit.__position ?? 1;
  const variant = useMemo(() => getCardVariant(variantPosition), [variantPosition]);

  // Display tags: prefer lvl1 leaf parts ("Parent > Child" → "Child");
  // fall back to lvl0 names when no lvl1 entries exist. Dedupe leaves —
  // distinct hierarchical paths can share a leaf (e.g. `A > X` + `B > X`),
  // and showing the same chip twice on one card reads as a bug.
  const displayTags = useMemo(() => {
    const lvl1 = hit['tags.lvl1'] ?? [];
    const source =
      lvl1.length > 0
        ? lvl1.map((tag) => {
            const sep = tag.indexOf(' > ');
            return sep > -1 ? tag.slice(sep + 3) : tag;
          })
        : (hit['tags.lvl0'] ?? []);
    return Array.from(new Set(source));
  }, [hit]);

  const backBody = hit.content || hit.fact || hit.blurb || '';

  // Top-of-card label: project name, falling back to the fact position
  // when a card has no project association.
  const topLabel = hit.projects?.[0] ?? `FACT · ${String(hit.__position ?? 0).padStart(2, '0')}`;
  const createdLabel = formatMonthYear(hit.created_at);

  return (
    <article
      className={`${styles.cardLink} ${isFlipped ? styles.cardLinkFlipped : ''}`}
      data-accent={variant.accent}
      data-size={variant.size}
    >
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        data-state={isFlipped ? 'expanded' : 'collapsed'}
      >
        <div className={styles.flipper}>
          <div className={styles.cardFront} aria-hidden={isFlipped}>
            <button
              ref={frontButtonRef}
              type="button"
              className={styles.flipButton}
              onClick={toggleFlip}
              aria-expanded={isFlipped}
              aria-label={`${hit.title}. Click to ${isFlipped ? 'collapse' : 'expand'}.`}
              tabIndex={isFlipped ? -1 : 0}
            />
            <div className={styles.content}>
              <div className={styles.cardMetaRow}>
                <span className={styles.metaLeft}>
                  <span className={styles.factCounter}>{topLabel}</span>
                  {createdLabel && <span className={styles.cardDate}>{createdLabel}</span>}
                </span>
                <div className={styles.cardMetaRight}>
                  <span
                    className="card-header-badge"
                    data-category={categoryLabel.toLowerCase().replace(/\s+/g, '-')}
                  >
                    {categoryLabel}
                  </span>
                  {hit.url && (
                    <SourceLinkButton
                      url={hit.url}
                      label={
                        isDevPost
                          ? `Read ${hit.title} on DEV Community`
                          : `View source for ${hit.title}`
                      }
                      icon={isDevPost ? <DevIcon /> : <GitHubIcon />}
                      tabIndex={isFlipped ? -1 : 0}
                    />
                  )}
                </div>
              </div>

              <h2 className={styles.title}>
                <Highlight attribute="title" hit={hit} />
              </h2>

              <p className={styles.description}>
                {hit.blurb ? (
                  <Highlight attribute="blurb" hit={hit} />
                ) : (
                  (hit.content || hit.fact || '').substring(0, 100) + '...'
                )}
              </p>

              {displayTags.length > 0 && (
                <div className="simple-tags">
                  {displayTags.map((tag) => (
                    <span key={tag} className="simple-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            ref={backButtonRef}
            className={styles.cardBack}
            aria-hidden={!isFlipped}
            role={isFlipped ? 'button' : undefined}
            tabIndex={isFlipped ? 0 : -1}
            aria-label={isFlipped ? `${hit.title}. Click to collapse.` : undefined}
            onClick={isFlipped ? toggleFlip : undefined}
            onKeyDown={isFlipped ? closeFromBackKeyboard : undefined}
          >
            <div className={styles.backContent}>
              <h3 className={styles.backTitle}>{hit.title}</h3>
              <p className={styles.backBody}>{backBody}</p>
              <div className={styles.backMeta}>
                <span className={styles.backMetaItem}>
                  node_type · {hit.node_type ?? 'principle'}
                </span>
                {hit.projects && hit.projects.length > 0 && (
                  <span className={styles.backMetaItem}>projects · {hit.projects.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

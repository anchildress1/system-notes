'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Highlight } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits, FactHitRecord } from '@/types/algolia';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import Badge from '@/components/Badge/Badge';
import Tag from '@/components/Tag/Tag';
import FlipCardShell from '@/components/FlipCardShell/FlipCardShell';
import { GitHubIcon, DevIcon } from '@/components/icons';
import { getCardVariant } from './cardVariant';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { getSafeHostname, isSafeExternalUrl } from '@/lib/urlSafety';
import cardStyles from '@/styles/card.module.css';
import styles from './FactCard.module.css';
import './highlight-overrides.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const backButtonRef = useRef<HTMLButtonElement>(null);
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
  const close = useCallback(() => setIsFlipped(false), []);
  useEscapeToClose(isFlipped, close);

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

  const sourceUrl = isSafeExternalUrl(hit.url) ? hit.url : undefined;
  const isDevPost = getSafeHostname(sourceUrl) === 'dev.to';

  const variantPosition = position ?? hit.__position ?? 1;
  const variant = useMemo(() => getCardVariant(variantPosition), [variantPosition]);

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
  const summarySuffix = backBody.length > 100 ? '…' : '';
  const fallbackSummary = backBody
    ? `${backBody.slice(0, 100)}${summarySuffix}`
    : 'No summary available.';

  const topLabel = hit.projects?.[0] ?? `FACT · ${String(hit.__position ?? 0).padStart(2, '0')}`;
  const createdLabel = formatMonthYear(hit.created_at);

  return (
    <FlipCardShell
      className={`${styles.cardLink} ${isFlipped ? styles.cardLinkFlipped : ''}`}
      accent={variant.accent}
      size={variant.size}
      cardClassName={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
      flipperClassName={styles.flipper}
      frontClassName={styles.cardFront}
      featured={variant.size === 'two-thirds'}
      isFlipped={isFlipped}
      front={
        <>
          <button
            type="button"
            ref={frontButtonRef}
            className={cardStyles.flipButton}
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
                <Badge variant="neutral">{categoryLabel}</Badge>
                {sourceUrl && (
                  <SourceLinkButton
                    url={sourceUrl}
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
              {hit.blurb ? <Highlight attribute="blurb" hit={hit} /> : fallbackSummary}
            </p>

            {displayTags.length > 0 && (
              <div className={styles.tagRow}>
                {displayTags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </div>
        </>
      }
    >
      <div
        className={`${styles.cardBack} ${cardStyles.flipBack} ${cardStyles.backSeam}${
          variant.size === 'two-thirds' ? ' shimmer-seam' : ''
        }`}
        aria-hidden={!isFlipped}
      >
        <button
          type="button"
          ref={backButtonRef}
          className={cardStyles.flipButton}
          onClick={toggleFlip}
          aria-label={`${hit.title}. Click to collapse.`}
          tabIndex={isFlipped ? 0 : -1}
        />
        <div className={styles.backContent}>
          <h3 className={styles.backTitle}>{hit.title}</h3>
          <p className={styles.backBody}>{backBody}</p>
          <div className={styles.backMeta}>
            <span className={styles.backMetaItem}>node_type · {hit.node_type ?? 'principle'}</span>
            {hit.projects && hit.projects.length > 0 && (
              <span className={styles.backMetaItem}>projects · {hit.projects.join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    </FlipCardShell>
  );
}

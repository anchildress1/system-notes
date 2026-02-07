'use client';

import React, { useEffect, useRef } from 'react';
import { useInfiniteHits } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';

interface InfiniteHitsProps {
  hitComponent: React.ComponentType<{ hit: Hit; sendEvent?: SendEventForHits }>;
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
    loadMore?: string;
  };
  [key: string]: unknown;
}

export default function InfiniteHits({
  hitComponent: HitComponent,
  classNames = {},
  ...props
}: InfiniteHitsProps) {
  const { hits, isLastPage, showMore, sendEvent } = useInfiniteHits(props);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const trackedViewIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (sentinelRef.current) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [isLastPage, showMore]);

  useEffect(() => {
    if (!sendEvent || hits.length === 0) return;

    const newHits = hits.filter((hit) => {
      if (!hit?.objectID || trackedViewIds.current.has(hit.objectID)) {
        return false;
      }
      trackedViewIds.current.add(hit.objectID);
      return true;
    });

    if (newHits.length > 0) {
      sendEvent('view', newHits, 'Search Results Viewed', {
        objectIDs: newHits.map((h) => h.objectID),
      });
    }
  }, [hits, sendEvent]);

  return (
    <div className={classNames.root}>
      <ul className={classNames.list}>
        {hits.map((hit) => (
          <li key={hit.objectID} className={classNames.item}>
            <HitComponent hit={hit} sendEvent={sendEvent} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: '20px', margin: '20px 0' }} />
    </div>
  );
}

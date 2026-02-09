'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();

  const nextPageHref = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    const currentPageRaw = params.get('page');
    const currentPage = currentPageRaw ? Number(currentPageRaw) : 1;
    const nextPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage + 1 : 2;
    params.set('page', String(nextPage));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '?page=2';
  }, [searchParams]);

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

  return (
    <div className={classNames.root}>
      <ul className={classNames.list}>
        {hits.map((hit) => (
          <li key={hit.objectID} className={classNames.item}>
            <HitComponent hit={hit} sendEvent={sendEvent} />
          </li>
        ))}
      </ul>
      {!isLastPage && (
        <a href={nextPageHref} className={classNames.loadMore}>
          Show more results
        </a>
      )}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: '20px', margin: '20px 0' }} />
    </div>
  );
}

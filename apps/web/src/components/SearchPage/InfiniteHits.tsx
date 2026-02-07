'use client';

import React, { useEffect, useRef } from 'react';
import { useInfiniteHits } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';

interface InfiniteHitsProps {
  hitComponent: React.ComponentType<{ hit: Hit }>;
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
  const { hits, isLastPage, showMore } = useInfiniteHits(props);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
            <HitComponent hit={hit} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: '20px', margin: '20px 0' }} />
    </div>
  );
}

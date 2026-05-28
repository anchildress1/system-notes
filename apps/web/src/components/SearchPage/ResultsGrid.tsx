'use client';

import type React from 'react';
import { useHits, useInstantSearch } from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import type { SendEventForHits } from '@/types/algolia';
import { getCardVariant } from '@/components/FactCard/cardVariant';

interface ResultsGridProps {
  hitComponent: React.ComponentType<{
    hit: Hit;
    sendEvent?: SendEventForHits;
    position?: number;
  }>;
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
    empty?: string;
  };
}

export default function ResultsGrid({
  hitComponent: HitComponent,
  classNames = {},
}: Readonly<ResultsGridProps>) {
  const { items, sendEvent } = useHits();
  const { status } = useInstantSearch();

  if (items.length === 0) {
    if (status === 'idle') {
      return (
        <div className={classNames.empty}>
          <p>No results. Try a broader term, or clear the filter.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={classNames.root}>
      <ul className={classNames.list}>
        {items.map((hit, index) => {
          // Keyed on array index (1-based) so each page starts a fresh cycle
          // at position 1. __position is cumulative across pages and can
          // start mid-cycle on page 2+, which breaks visual rhythm.
          const position = index + 1;
          const variant = getCardVariant(position);
          return (
            <li key={hit.objectID} className={classNames.item} data-size={variant.size}>
              <HitComponent hit={hit} sendEvent={sendEvent} position={position} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

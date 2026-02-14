'use client';

import type { Hit } from 'instantsearch.js';
import FactCard, { FactHitRecord } from '../FactCard/FactCard';
import type { SendEventForHits } from '@/types/algolia';

interface UnifiedHitCardProps {
  hit: Hit<FactHitRecord>;
  sendEvent?: SendEventForHits;
}

export default function UnifiedHitCard({ hit, sendEvent }: UnifiedHitCardProps) {
  return <FactCard hit={hit} sendEvent={sendEvent} />;
}

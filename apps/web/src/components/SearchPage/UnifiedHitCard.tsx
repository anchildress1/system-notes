'use client';

import type { Hit } from 'instantsearch.js';
import FactCard, { FactHitRecord } from '../FactCard/FactCard';
import PostCard, { PostHitRecord } from '../PostCard/PostCard';
import type { SendEventForHits } from '@/types/algolia';

interface BaseHitRecord {
  objectID: string;
  title: string;
  url?: string;
  blurb: string;
  fact: string;
  content?: string;
  category: string;
  [key: string]: unknown;
}

interface UnifiedHitCardProps {
  hit: Hit<BaseHitRecord>;
  sendEvent?: SendEventForHits;
}

export default function UnifiedHitCard({ hit, sendEvent }: UnifiedHitCardProps) {
  const isBlogPost = hit.url || (hit.blurb && hit.blurb.startsWith('http'));

  if (isBlogPost) {
    return <PostCard hit={hit as unknown as Hit<PostHitRecord>} sendEvent={sendEvent} />;
  }

  return <FactCard hit={hit as unknown as Hit<FactHitRecord>} sendEvent={sendEvent} />;
}

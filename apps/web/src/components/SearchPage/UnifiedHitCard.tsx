'use client';

import type { Hit } from 'instantsearch.js';
import FactCard, { FactHitRecord } from '../FactCard/FactCard';
import PostCard, { PostHitRecord } from '../PostCard/PostCard';

interface BaseHitRecord {
  objectID: string;
  title: string;
  url?: string;
  blurb: string;
  fact: string;
  category: string;
  [key: string]: unknown;
}

interface UnifiedHitCardProps {
  hit: Hit<BaseHitRecord>;
}

export default function UnifiedHitCard({ hit }: UnifiedHitCardProps) {
  const isBlogPost = hit.url || (hit.blurb && hit.blurb.startsWith('http'));

  if (isBlogPost) {
    return <PostCard hit={hit as unknown as Hit<PostHitRecord>} />;
  }

  return <FactCard hit={hit as unknown as Hit<FactHitRecord>} />;
}

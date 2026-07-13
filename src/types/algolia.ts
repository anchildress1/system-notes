import type { Hit, BaseHit } from 'instantsearch.js';

export type SendEventForHits = {
  (eventType: string, hits: Hit | Hit[], eventName?: string): void;
  (customPayload: unknown): void;
};

export interface FactHitRecord extends BaseHit {
  objectID: string;
  title: string;
  blurb: string;
  fact: string;
  content?: string;
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  projects: string[];
  category: string;
  node_type?: string;
  signal: number;
  url?: string;
  created_at?: string;
}

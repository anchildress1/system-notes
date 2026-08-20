import type { BaseHit } from 'instantsearch.js';

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
  url?: string;
  created_at?: string;
}

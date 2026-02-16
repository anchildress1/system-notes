import type { Hit } from 'instantsearch.js';

export type SendEventForHits = {
  (eventType: string, hits: Hit | Hit[], eventName?: string): void;
  (customPayload: unknown): void;
};

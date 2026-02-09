import type { Hit } from 'instantsearch.js';

export type SendEventForHits = {
  (
    eventType: string,
    hits: Hit | Hit[],
    eventName?: string,
    additionalData?: Record<string, unknown>
  ): void;
  (customPayload: unknown): void;
};

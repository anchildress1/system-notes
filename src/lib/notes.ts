import { cache } from 'react';
import { algoliasearch } from 'algoliasearch';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import { isValidNoteId, normalizeFactHitRecord } from '@/lib/noteContent';
import type { FactHitRecord } from '@/types/algolia';

type UnknownRecord = Record<string, unknown>;
const NOTE_LOOKUP_DEADLINE_MS = 5_000;

export type NoteLookupResult =
  | { status: 'found'; note: FactHitRecord }
  | { status: 'missing' }
  | { status: 'unavailable' };

const noteClient = hasValidAlgoliaCredentials()
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
  : null;

export function parseNoteRecord(value: unknown, expectedId: string): FactHitRecord | null {
  const note = normalizeFactHitRecord(value);
  return note?.objectID === expectedId ? note : null;
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: unknown }).status === 404
  );
}

function reportLookupFailure(error: unknown): void {
  const status =
    error && typeof error === 'object' && 'status' in error
      ? (error as { status?: unknown }).status
      : undefined;
  console.error('Note lookup failed.', {
    name: error instanceof Error ? error.name : 'ProviderError',
    status: typeof status === 'number' ? status : undefined,
  });
}

async function withLookupDeadline<T>(request: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = globalThis.setTimeout(
      () => reject(new Error('Note lookup exceeded its response deadline.')),
      NOTE_LOOKUP_DEADLINE_MS
    );
  });
  try {
    return await Promise.race([request, deadline]);
  } finally {
    if (timeout) globalThis.clearTimeout(timeout);
  }
}

export const getNoteById = cache(async (noteId: string): Promise<NoteLookupResult> => {
  if (!isValidNoteId(noteId)) return { status: 'missing' };
  if (!noteClient) return { status: 'unavailable' };

  try {
    const record = await withLookupDeadline(
      noteClient.getObject<UnknownRecord>({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: noteId,
        attributesToRetrieve: [
          'objectID',
          'title',
          'blurb',
          'fact',
          'content',
          'tags.lvl0',
          'tags.lvl1',
          'projects',
          'category',
          'url',
          'created_at',
        ],
      })
    );
    const note = parseNoteRecord(record, noteId);
    if (note) return { status: 'found', note };
    console.error('Note lookup returned a malformed record.', { objectID: noteId });
    return { status: 'unavailable' };
  } catch (error) {
    if (isNotFoundError(error)) return { status: 'missing' };
    reportLookupFailure(error);
    return { status: 'unavailable' };
  }
});

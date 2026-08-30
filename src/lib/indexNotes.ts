import { cache } from 'react';
import { algoliasearch } from 'algoliasearch';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, hasValidAlgoliaCredentials } from '@/lib/algolia';
import { NOTE_BODY_FALLBACK, getNoteBody, normalizeFactHitRecord } from '@/lib/noteContent';

/** How long a fetched page of notes is reused before the index is asked again. */
export const NOTES_TTL_MS = 5 * 60_000;

/** How long the index gets to answer before the route renders without it. */
const NOTES_DEADLINE_MS = 3_000;

/* The workspace is client-only, so this is the whole of what a crawler — or a
   reader without scripting — ever sees of the corpus. Bounded rather than the
   full index: the route is gated at a mobile Lighthouse floor of 92, and the
   notes are ranked, so the tail buys far less than it costs. */
export const SSR_NOTE_LIMIT = 60;

/** One note, flattened to what the server-rendered list actually shows. */
export interface IndexNote {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string | null;
}

const notesClient =
  process.env.INDEX_PULSE_DISABLED === 'true' || !hasValidAlgoliaCredentials()
    ? null
    : algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

let cached: { at: number; value: IndexNote[] } | null = null;

/**
 * Flattens raw index records into the shape the list renders.
 *
 * @param hits Records straight off the index, of unknown shape.
 * @returns Notes that carried a usable id, title and body, in the order given.
 */
export function toIndexNotes(hits: readonly unknown[]): IndexNote[] {
  const notes: IndexNote[] = [];
  for (const hit of hits) {
    const record = normalizeFactHitRecord(hit);
    if (!record) continue;
    const body = getNoteBody(record);
    // The workspace can show its filler in a reader who chose that note. The
    // manifest is indexable text, so a note with nothing to say is left out
    // rather than published as "No detail available."
    if (!body || body === NOTE_BODY_FALLBACK) continue;
    notes.push({
      id: record.objectID,
      title: record.title,
      body,
      category: record.category,
      createdAt: typeof record.created_at === 'string' ? record.created_at : null,
    });
  }
  return notes;
}

/* Reads a bounded page of notes for the server-rendered list.

   Degrades to an empty list rather than taking the route down: the workspace
   still mounts for anyone running scripts, which is the path that was already
   the only one working. */
export const getIndexNotes = cache(async (): Promise<IndexNote[]> => {
  if (!notesClient) return [];
  if (cached && Date.now() - cached.at < NOTES_TTL_MS) return cached.value;

  try {
    const response = await withNotesDeadline(
      notesClient.searchSingleIndex(
        {
          indexName: ALGOLIA_INDEX_NAME,
          searchParams: {
            query: '',
            hitsPerPage: SSR_NOTE_LIMIT,
            attributesToRetrieve: [
              'objectID',
              'title',
              'fact',
              'content',
              'category',
              'created_at',
            ],
          },
        },
        // Bounds the REQUEST, not just the wait on it. Racing a promise leaves the
        // socket open behind a route that has already given up; the transport's own
        // timeout is what actually ends it. The outer deadline still guards the
        // render path, since these bound the connect and read legs separately.
        { timeouts: { connect: NOTES_DEADLINE_MS, read: NOTES_DEADLINE_MS } }
      )
    );
    const value = toIndexNotes(response.hits);
    cached = { at: Date.now(), value };
    return value;
  } catch (error) {
    console.error('Index notes lookup failed.', {
      name: error instanceof Error ? error.name : 'ProviderError',
    });
    // A dynamic route must not make every request wait through the same outage.
    cached = { at: Date.now(), value: [] };
    return [];
  }
});

function withNotesDeadline<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = globalThis.setTimeout(
      () => reject(new Error('Index notes exceeded their response deadline.')),
      NOTES_DEADLINE_MS
    );
  });
  return Promise.race([request, deadline]).finally(() => {
    if (timer) globalThis.clearTimeout(timer);
  });
}

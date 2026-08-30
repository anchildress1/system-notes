import type { Hit } from 'instantsearch.js';
import type { FactHitRecord } from '@/types/algolia';

const NOTE_ID_PATTERN = /^[a-zA-Z0-9:_-]{1,200}$/;

type NoteText = {
  content?: unknown;
  fact?: unknown;
  blurb?: unknown;
};

type NoteTaxonomy = {
  'tags.lvl0'?: unknown;
  'tags.lvl1'?: unknown;
  projects?: unknown;
};

function usefulString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const normalized = usefulString(item);
    return normalized ? [normalized] : [];
  });
}

export function isValidNoteId(value: string): boolean {
  return NOTE_ID_PATTERN.test(value);
}

/** What a note with no readable body reads as in the workspace. Exported so a
 *  consumer that must not publish filler can recognise it. */
export const NOTE_BODY_FALLBACK = 'No detail available.';

export function getNoteBody(note: NoteText): string {
  return (
    usefulString(note.content) ??
    usefulString(note.fact) ??
    usefulString(note.blurb) ??
    NOTE_BODY_FALLBACK
  );
}

export function getNoteTags(note: NoteTaxonomy): string[] {
  const nested = stringList(note['tags.lvl1']);
  const source = nested.length > 0 ? nested : stringList(note['tags.lvl0']);
  const tags = source
    .map((tag) => {
      const separator = tag.indexOf(' > ');
      return separator >= 0 ? tag.slice(separator + 3) : tag;
    })
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

export function getNoteProjects(note: NoteTaxonomy): string[] {
  return [...new Set(stringList(note.projects))];
}

export function normalizeFactHitRecord(value: unknown): FactHitRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const objectID = usefulString(record['objectID']);
  const title = usefulString(record['title']);
  if (!objectID || !isValidNoteId(objectID) || !title) return null;
  const safeRecord = { ...record };
  delete safeRecord['_highlightResult'];
  delete safeRecord['_snippetResult'];

  return {
    ...safeRecord,
    objectID,
    title,
    blurb: usefulString(record['blurb']) ?? '',
    fact: usefulString(record['fact']) ?? '',
    content: usefulString(record['content']),
    'tags.lvl0': stringList(record['tags.lvl0']),
    'tags.lvl1': stringList(record['tags.lvl1']),
    projects: getNoteProjects(record),
    category: usefulString(record['category']) ?? 'Note',
    url: usefulString(record['url']),
    created_at: usefulString(record['created_at']),
  };
}

export function normalizeFactSearchHit(value: unknown): Hit<FactHitRecord> | null {
  const note = normalizeFactHitRecord(value);
  return note ? (note as Hit<FactHitRecord>) : null;
}

export function getFactHitPosition(hit: Pick<Hit, '__position'>, fallback: number): number {
  return Number.isSafeInteger(hit.__position) && hit.__position > 0 ? hit.__position : fallback;
}

export function formatNoteDate(value?: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

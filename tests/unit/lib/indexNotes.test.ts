import { describe, expect, it } from 'vitest';
import { SSR_NOTE_LIMIT, toIndexNotes } from '@/lib/indexNotes';

const record = (over: Record<string, unknown> = {}) => ({
  objectID: 'note-1',
  title: 'Told the presentation was the problem',
  fact: 'I changed the data instead.',
  category: 'Decisions',
  projects: ['System Notes'],
  created_at: '2026-08-01T00:00:00.000Z',
  ...over,
});

describe('toIndexNotes', () => {
  it('flattens a record to what the manifest renders', () => {
    const [note] = toIndexNotes([record()]);
    expect(note).toEqual({
      id: 'note-1',
      title: 'Told the presentation was the problem',
      body: 'I changed the data instead.',
      category: 'Decisions',
      createdAt: '2026-08-01T00:00:00.000Z',
    });
  });

  it('drops a malformed record rather than rendering a blank entry', () => {
    // The manifest is the only copy of the corpus a crawler sees. A record with
    // no title would publish an empty note rather than omit it.
    expect(toIndexNotes([{ objectID: 'x' }, record()])).toHaveLength(1);
  });

  it('never publishes the workspace filler as indexable text', () => {
    // getNoteBody falls back to "No detail available." The workspace may show
    // that to a reader who chose the note; putting it in the manifest would ship
    // filler as the crawlable body of a real entry.
    expect(toIndexNotes([record({ fact: '   ', content: undefined, blurb: undefined })])).toEqual(
      []
    );
  });

  it('keeps a note that carried no date rather than discarding it', () => {
    const [note] = toIndexNotes([record({ created_at: undefined })]);
    expect(note.createdAt).toBeNull();
    expect(note.title).not.toBe('');
  });

  it('preserves the order the index ranked them in', () => {
    const notes = toIndexNotes([
      record({ objectID: 'a', title: 'First' }),
      record({ objectID: 'b', title: 'Second' }),
    ]);
    expect(notes.map((note) => note.id)).toEqual(['a', 'b']);
  });

  it('bounds the server-rendered page against the route performance floor', () => {
    // /notes gates at a mobile Lighthouse floor of 92 and the corpus runs to
    // hundreds. An unbounded fetch would put the whole index in the HTML.
    expect(SSR_NOTE_LIMIT).toBeGreaterThan(0);
    expect(SSR_NOTE_LIMIT).toBeLessThanOrEqual(100);
  });
});

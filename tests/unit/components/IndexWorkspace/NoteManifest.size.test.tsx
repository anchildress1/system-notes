import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NoteManifest from '@/components/IndexWorkspace/NoteManifest';
import { SSR_NOTE_LIMIT, type IndexNote } from '@/lib/indexNotes';

/* The manifest is the only part of this route whose weight this repo controls,
   and the mobile Lighthouse gate cannot see it: make test-perf sets
   INDEX_PULSE_DISABLED=true, so getIndexNotes returns [] and the gate measures
   the loading shell instead. This asserts the payload directly. */

/** A note at the long end of what the index actually holds. */
const longNote = (index: number): IndexNote => ({
  id: `note-${index}`,
  // Roughly the longest title and fact observed in the live index, so the budget
  // is measured against a bad case rather than an average one.
  title: 'Told the presentation was the problem, I changed the data instead again',
  body:
    'Every card carried a blurb and a fact — a summary of a summary — and the blurb was ' +
    'the half being indexed and shown. I deleted the blurb, put the fact itself on the ' +
    'tile, and cut 103 cards that turned out to be describing rather than deciding.',
  category: 'Decisions',
  createdAt: '2026-08-01T00:00:00.000Z',
});

/* Bytes per note, not total: the count is already bounded by SSR_NOTE_LIMIT and
   guarded separately, so this is the one that catches markup growth. Measured at
   roughly 430 B/note; the ceiling leaves room for a wrapper without leaving room
   for a second copy of the body. */
const MAX_BYTES_PER_NOTE = 700;

describe('NoteManifest payload', () => {
  it('keeps the rendered markup within its per-note budget', () => {
    const notes = Array.from({ length: SSR_NOTE_LIMIT }, (_, index) => longNote(index));
    const bytes = Buffer.byteLength(renderToStaticMarkup(<NoteManifest notes={notes} />), 'utf8');

    expect(bytes / SSR_NOTE_LIMIT).toBeLessThan(MAX_BYTES_PER_NOTE);
  });

  it('scales with the note count rather than carrying fixed bulk', () => {
    // A wrapper that ballooned per render would show up as a constant the budget
    // above could absorb while the real page could not.
    const render = (count: number) =>
      Buffer.byteLength(
        renderToStaticMarkup(
          <NoteManifest notes={Array.from({ length: count }, (_, i) => longNote(i))} />
        ),
        'utf8'
      );

    expect(render(20) - render(10)).toBeLessThan(MAX_BYTES_PER_NOTE * 10);
  });
});

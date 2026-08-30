import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NoteManifest from '@/components/IndexWorkspace/NoteManifest';
import type { IndexNote } from '@/lib/indexNotes';

const note = (over: Partial<IndexNote> = {}): IndexNote => ({
  id: 'note-1',
  title: 'Told the presentation was the problem',
  body: 'I changed the data instead.',
  category: 'Decisions',
  createdAt: '2026-08-01T00:00:00.000Z',
  ...over,
});

describe('NoteManifest', () => {
  it('puts the note body in the markup, not just the title', () => {
    // The workspace is client-only, so this is the whole of the corpus a crawler
    // or a reader without scripting ever receives. Titles alone would restore the
    // thin-content problem this exists to fix.
    render(<NoteManifest notes={[note()]} />);

    expect(screen.getByRole('heading', { name: /told the presentation/i })).toBeVisible();
    expect(screen.getByText('I changed the data instead.')).toBeVisible();
  });

  it('renders every note it is given', () => {
    render(
      <NoteManifest
        notes={[note({ id: 'a', title: 'First' }), note({ id: 'b', title: 'Second' })]}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing at all when the index gave nothing back', () => {
    // getIndexNotes degrades to an empty list on an outage. An empty "Filed notes"
    // heading over no notes is worse than no section.
    const { container } = render(<NoteManifest notes={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('omits the date rather than printing a placeholder for a note without one', () => {
    render(<NoteManifest notes={[note({ createdAt: null })]} />);

    expect(screen.getByText('Decisions')).toBeVisible();
    expect(screen.queryByText(/·\s*$/)).not.toBeInTheDocument();
  });
});

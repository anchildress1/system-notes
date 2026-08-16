import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FactHitRecord } from '@/types/algolia';

const notePageHarness = vi.hoisted(() => ({
  getNoteById: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/notes', () => ({ getNoteById: notePageHarness.getNoteById }));
vi.mock('next/navigation', () => ({ notFound: notePageHarness.notFound }));

import NotePage, { generateMetadata } from './page';

const note: FactHitRecord = {
  objectID: 'card:test:1',
  title: 'Failure is useful data',
  blurb: 'A short explanation of the decision.',
  fact: 'The detailed evidence behind the decision.',
  content: 'The complete evidence behind the decision.',
  category: 'Principle',
  projects: ['System Notes'],
  'tags.lvl0': ['Testing'],
  'tags.lvl1': ['Testing > Failure paths'],
  url: 'https://github.com/anchildress1/system-notes',
  created_at: '2026-08-01T00:00:00Z',
};

const props = (id = note.objectID) => ({ params: Promise.resolve({ id }) });

describe('NotePage', () => {
  beforeEach(() => {
    notePageHarness.getNoteById.mockReset();
    notePageHarness.getNoteById.mockResolvedValue({ status: 'found', note });
    notePageHarness.notFound.mockReset();
    notePageHarness.notFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('renders the full note, taxonomy, source, and project filter link', async () => {
    render(await NotePage(props()));

    expect(screen.getByRole('heading', { name: note.title })).toBeInTheDocument();
    expect(screen.getByText(note.content!)).toBeInTheDocument();
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    expect(screen.getByText('Failure paths')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'System Notes' })).toHaveAttribute(
      'href',
      '/?project=System+Notes#notes-index'
    );
    expect(screen.getByRole('link', { name: /View evidence/i })).toHaveAttribute('href', note.url);
  });

  it('builds page-specific metadata with the shared social image', async () => {
    await expect(generateMetadata(props())).resolves.toMatchObject({
      title: { absolute: `${note.title} | Ashley's System Notes` },
      alternates: { canonical: '/notes/card%3Atest%3A1' },
      openGraph: {
        type: 'article',
        url: '/notes/card%3Atest%3A1',
        images: [{ url: '/projects/system-notes.webp' }],
      },
      twitter: { images: ['/projects/system-notes.webp'] },
    });
  });

  it('omits an unsafe evidence URL', async () => {
    notePageHarness.getNoteById.mockResolvedValue({
      status: 'found',
      note: { ...note, url: 'javascript:alert(1)' },
    });

    render(await NotePage(props()));

    expect(screen.queryByRole('link', { name: /View evidence/i })).not.toBeInTheDocument();
  });

  it('uses the designed not-found path and noindex metadata for a missing note', async () => {
    notePageHarness.getNoteById.mockResolvedValue({ status: 'missing' });

    await expect(NotePage(props('card:missing:1'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notePageHarness.notFound).toHaveBeenCalledOnce();
    await expect(generateMetadata(props('card:missing:1'))).resolves.toMatchObject({
      robots: { index: false, follow: false },
    });
  });

  it('renders provider failures without converting them to false 404s', async () => {
    notePageHarness.getNoteById.mockResolvedValue({ status: 'unavailable' });

    render(await NotePage(props()));

    expect(screen.getByRole('heading', { name: 'The note did not answer.' })).toBeInTheDocument();
    expect(screen.getByText(/nothing was invented/i)).toBeInTheDocument();
    expect(notePageHarness.notFound).not.toHaveBeenCalled();
    await expect(generateMetadata(props())).resolves.toMatchObject({
      title: { absolute: "Note unavailable | Ashley's System Notes" },
      robots: { index: false, follow: true },
    });
  });
});

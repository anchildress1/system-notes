import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import { formatNoteDate, getNoteBody, getNoteTags } from '@/lib/noteContent';
import { getNoteById } from '@/lib/notes';
import { getProjectNotesURL } from '@/lib/searchRouting';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { isSafeExternalUrl } from '@/lib/urlSafety';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getNoteById(id);
  if (result.status === 'missing') {
    return {
      title: { absolute: "Note not found | Ashley's System Notes" },
      robots: { index: false, follow: false },
    };
  }
  if (result.status === 'unavailable') {
    return {
      title: { absolute: "Note unavailable | Ashley's System Notes" },
      description: 'The requested note could not be retrieved right now.',
      robots: { index: false, follow: true },
    };
  }
  const { note } = result;
  const title = `${note.title} | Ashley's System Notes`;
  const description = note.blurb || getNoteBody(note).slice(0, 160);
  const url = `/notes/${encodeURIComponent(note.objectID)}`;
  return buildPageMetadata({ title, description, path: url, type: 'article' });
}

export default async function NotePage({ params }: Readonly<NotePageProps>) {
  const { id } = await params;
  const result = await getNoteById(id);
  if (result.status === 'missing') notFound();
  if (result.status === 'unavailable') return <NoteUnavailable />;
  const { note } = result;

  const date = formatNoteDate(note.created_at);
  const tags = getNoteTags(note);
  const sourceUrl = isSafeExternalUrl(note.url) ? note.url : undefined;

  return (
    <main id="main-content" className={styles.main}>
      <article className={styles.note}>
        <header className={styles.header}>
          <Link className={styles.backLink} href="/">
            <FiArrowLeft aria-hidden="true" /> Back to index
          </Link>
          <p className={styles.kicker}>{note.category || 'Note'}</p>
          <h1>{note.title}</h1>
          {note.blurb ? <p className={styles.blurb}>{note.blurb}</p> : null}
        </header>

        <div className={styles.layout}>
          <aside className={styles.metadata} aria-label="Note details">
            <dl>
              {date ? (
                <div>
                  <dt>Date</dt>
                  <dd>{date}</dd>
                </div>
              ) : null}
              {note.projects.length > 0 ? (
                <div>
                  <dt>Projects</dt>
                  <dd>
                    {note.projects.map((project) => (
                      <Link key={project} href={getProjectNotesURL(project)}>
                        {project}
                      </Link>
                    ))}
                  </dd>
                </div>
              ) : null}
              {tags.length > 0 ? (
                <div>
                  <dt>Topics</dt>
                  <dd>{tags.join(' · ')}</dd>
                </div>
              ) : null}
            </dl>
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                View evidence <FiArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </aside>
          <div className={styles.content}>{getNoteBody(note)}</div>
        </div>
      </article>
    </main>
  );
}

function NoteUnavailable() {
  return (
    <main id="main-content" className={styles.main}>
      <output className={styles.unavailable}>
        <Link className={styles.backLink} href="/">
          <FiArrowLeft aria-hidden="true" /> Back to index
        </Link>
        <p className={styles.kicker}>Retrieval unavailable</p>
        <h1>The note did not answer.</h1>
        <p>
          The address is valid. Its evidence could not be retrieved right now, so nothing was
          invented to fill the gap.
        </p>
      </output>
    </main>
  );
}

import type { IndexNote } from '@/lib/indexNotes';
import { formatNoteDate } from '@/lib/noteContent';
import styles from './NoteManifest.module.css';

/* The corpus as plain server-rendered text.

   The workspace is client-only, so without this a crawler and a reader with
   scripting off both got "Loading the index •••" and nothing else. It is the
   list the workspace replaces once it mounts, not a second copy shown beside it. */
export default function NoteManifest({ notes }: Readonly<{ notes: IndexNote[] }>) {
  if (notes.length === 0) return null;

  return (
    <div className={styles.manifest}>
      <h2 className={styles.heading}>Filed notes</h2>
      <ol className={styles.list}>
        {notes.map((note) => {
          const filed = formatNoteDate(note.createdAt ?? undefined);
          return (
            <li key={note.id} className={styles.note}>
              <p className={styles.meta}>
                {note.category}
                {filed ? ` · ${filed}` : null}
              </p>
              <h3 className={styles.title}>{note.title}</h3>
              <p className={styles.body}>{note.body}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

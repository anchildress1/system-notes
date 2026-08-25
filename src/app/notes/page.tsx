import type { Metadata } from 'next';
import IndexWorkspaceLoader from '@/components/IndexWorkspace/IndexWorkspaceLoader';
import { getIndexPulse } from '@/lib/indexPulse';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: "Index | Ashley's System Notes",
  description:
    'Search the engineering decisions, constraints, failures, and working rules behind what Ashley Childress builds.',
  path: '/notes',
});

export default async function NotesIndexPage() {
  const pulse = await getIndexPulse();

  return (
    <main id="main-content" className={styles.main}>
      <div className={`page-head ${styles.head}`}>
        <p className="page-head-slug">
          <span>Index</span>
        </p>
        <h1 data-scale="compact">
          How I decide.
          <span>Filed, dated, and searchable.</span>
        </h1>
      </div>
      <section
        id="notes-index"
        className={`page-column ${styles.indexSection}`}
        aria-label="System Notes index"
      >
        <IndexWorkspaceLoader pulse={pulse} />
      </section>
    </main>
  );
}

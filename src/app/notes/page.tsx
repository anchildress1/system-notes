import type { Metadata } from 'next';
import IndexPulseLine from '@/components/IndexWorkspace/IndexPulseLine';
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
      <div className="page-head">
        {/* compact, not the default: this head shares the fold with the search
            tool it introduces, and its turn is the one headline on the site too
            wide for the default 18ch measure — it broke into two highlighter
            bands with "searchable." orphaned on the second. Both conditions are
            exactly what the variant was named for. */}
        <h1 data-scale="compact">
          How I decide.
          <br />
          <span>Filed, dated, and searchable.</span>
        </h1>
        {pulse ? (
          <p className={styles.pulse}>
            <IndexPulseLine pulse={pulse} />
          </p>
        ) : null}
      </div>
      <section
        id="notes-index"
        className={`page-column ${styles.indexSection}`}
        aria-label="System Notes index"
      >
        <IndexWorkspaceLoader />
      </section>
    </main>
  );
}

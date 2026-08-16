import type { Metadata } from 'next';
import IndexWorkspaceLoader from '@/components/IndexWorkspace/IndexWorkspaceLoader';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: "Index | Ashley's System Notes",
  description:
    'Search the engineering decisions, constraints, failures, and working rules behind what Ashley Childress builds.',
  path: '/',
});

export default function Home() {
  return (
    <main id="main-content" className={styles.main}>
      <h1 className="visually-hidden">System Notes Index</h1>
      <section id="notes-index" className={styles.indexSection} aria-label="System Notes index">
        <IndexWorkspaceLoader />
      </section>
    </main>
  );
}

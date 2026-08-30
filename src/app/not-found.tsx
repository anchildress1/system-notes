import type { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import styles from './not-found.module.css';

/* Without this the route inherited the layout's title and openGraph wholesale, so
   a dead link previewed as the home page under the home page's name. The status
   code carries the SEO signal; this is about what a shared link looks like. */
export const metadata: Metadata = {
  title: { absolute: 'Page not found | Ashley’s System Notes' },
  description: 'That address holds no record.',
  // No `robots`. Next emits its own `noindex` for this route, and adding one
  // here just puts a second robots tag on the page — the thing removing the
  // layout's `index, follow` was meant to stop.
  openGraph: {
    title: 'Page not found',
    description: 'That address holds no record.',
  },
};

export default function NotFoundPage() {
  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.message} aria-labelledby="not-found-heading">
        <p className={styles.code}>404 · Record absent</p>
        <h1 id="not-found-heading" className="page-head-title">
          This trail ends <span>without a note.</span>
        </h1>
        <p>
          The address is wrong, the record moved, or the thing never existed. The index remains less
          fictional.
        </p>
        <nav aria-label="Not found options">
          <Link className="marked-hover" href="/notes">
            <FiArrowLeft aria-hidden="true" /> Search the index
          </Link>
          <Link className="marked-hover" href="/projects">
            Browse projects <FiArrowUpRight aria-hidden="true" />
          </Link>
        </nav>
      </section>
      <p className={styles.marker} aria-hidden="true">
        404
      </p>
    </main>
  );
}

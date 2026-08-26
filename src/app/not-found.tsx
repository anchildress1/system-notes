import Link from 'next/link';
import { FiArrowLeft, FiArrowUpRight } from 'react-icons/fi';
import styles from './not-found.module.css';

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

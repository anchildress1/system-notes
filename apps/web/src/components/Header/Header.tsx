import { Code } from 'lucide-react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <h1 className={styles.name}>Ashley&apos;s System Notes</h1>
        <p className={styles.subtitle}>
          A living map of software systems, decisions, and AI-assisted work.
        </p>
      </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${styles.active}`}>
          Projects
        </Link>
        <Link href="/about" className={styles.navItem}>
          About
        </Link>
        <Link href="/sitemap" className={styles.navItem}>
          Sitemap
        </Link>
        <a
          href="https://dev.to/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="blog-link"
          className={styles.ctaButton}
        >
          <Code size={16} style={{ marginRight: '0.5rem' }} />
          Read My Blog
        </a>
      </nav>
    </header>
  );
}

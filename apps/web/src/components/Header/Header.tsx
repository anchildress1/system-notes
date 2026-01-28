import { FaCode } from 'react-icons/fa';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <div className={styles.identity}>
        <Link href="/" className={styles.logoLink}>
          <span className={styles.name}>Ashley&apos;s System Notes</span>
        </Link>
        <p className={styles.subtitle}>
          A living map of software systems, decisions, and AI-assisted work.
        </p>
      </div>

      <nav className={styles.nav} aria-label="Main Navigation">
        <Link href="/" className={styles.navLink}>
          Projects
        </Link>
        <Link href="/about" className={styles.navLink}>
          About
        </Link>
        <Link href="/sitemap" className={styles.navLink}>
          Sitemap
        </Link>
        <a
          href="https://dev.to/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="blog-link"
          className={styles.ctaButton}
        >
          <Code size={16} />
          Read My Blog
        </a>
      </nav>
    </header>
  );
}

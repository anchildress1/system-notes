import { Code } from 'lucide-react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <h1 className={styles.name}>Ashley Childress&apos; System Notes</h1>
      </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${styles.active}`}>Projects</Link>
        <Link href="/about" className={styles.navItem}>
          About Ashley
        </Link>
        <a
          href="https://dev.to/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
        >
          <Code size={16} style={{ marginRight: '0.5rem' }} />
          Read My Blog
        </a>
      </nav>
    </header>
  );
}

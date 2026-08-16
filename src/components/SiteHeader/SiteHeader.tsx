'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteHeader.module.css';

const destinations = [
  { href: '/', label: 'Index' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/notes/');
  return pathname === href;
}

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.wordmark}>Ashley Childress</span>
          <span className={styles.motto}>every choice I&apos;d defend</span>
        </Link>
        <div className={styles.rightSide}>
          <nav className={styles.navigation} aria-label="Primary navigation">
            {destinations.map(({ href, label }) => {
              const current = isCurrentPath(pathname, href);
              return (
                <Link
                  key={href}
                  className={styles.navLink}
                  href={href}
                  aria-current={current ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
            <a
              className={styles.navLink}
              href="https://dev.to/anchildress1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Writing <span aria-hidden="true">↗</span>
            </a>
          </nav>
          <p className={styles.status}>
            <span aria-hidden="true" /> searchable decisions · the index stays open
          </p>
        </div>
      </div>
    </header>
  );
}

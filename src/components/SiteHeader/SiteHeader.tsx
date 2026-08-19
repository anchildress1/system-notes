'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './SiteHeader.module.css';

const destinations = [
  { href: '/', label: 'the index' },
  { href: '/projects', label: 'exhibits' },
  { href: '/about', label: 'about' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/notes/');
  return pathname === href;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [songOn, setSongOn] = useState(false);

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
              blog <span aria-hidden="true">↗</span>
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </a>
            <button
              type="button"
              className={styles.songToggle}
              aria-pressed={songOn}
              onClick={() => setSongOn((on) => !on)}
            >
              <span aria-hidden="true">♫</span> theme song
            </button>
          </nav>
          <p className={styles.status}>
            <span aria-hidden="true" /> the index never closes
          </p>
        </div>
      </div>
    </header>
  );
}

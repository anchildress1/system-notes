'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './SiteHeader.module.css';

const destinations = [
  { href: '/', label: 'ask me a question' },
  { href: '/projects', label: 'what I’ve shipped' },
  { href: '/notes', label: 'how I decide' },
  { href: '/about', label: 'about me' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  // A note is a record out of the index, so the index stays marked while reading
  // one. The intake at / owns nothing below it and matches exactly.
  if (href === '/notes') return pathname === '/notes' || pathname.startsWith('/notes/');
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
        </Link>
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

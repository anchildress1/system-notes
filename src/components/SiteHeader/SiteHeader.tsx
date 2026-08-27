'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { BLOG_URL } from '@/config';
import styles from './SiteHeader.module.css';

const destinations = [
  { href: '/', label: 'ask me a question' },
  { href: '/projects', label: 'what I’ve shipped' },
  { href: '/notes', label: 'how I decide' },
  { href: '/about', label: 'about me' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href;
}

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <a
        className={styles.skipLink}
        data-variant="filled"
        data-accent="filled"
        href="#main-content"
      >
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
          <a className={styles.navLink} href={BLOG_URL} target="_blank" rel="noopener noreferrer">
            blog <span aria-hidden="true">↗</span>
            <span className={styles.srOnly}> (opens in a new tab)</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

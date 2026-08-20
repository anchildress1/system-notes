'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import ThemeSong from '@/components/ThemeSong/ThemeSong';
import type { IndexPulse } from '@/lib/indexPulse';
import { relativeAge } from '@/lib/relativeAge';
import styles from './SiteHeader.module.css';

const destinations = [
  { href: '/', label: 'the index' },
  { href: '/projects', label: 'exhibits' },
  { href: '/about', label: 'about' },
] as const;

/** The age depends on the clock, not on a store anything can push to. */
const subscribeToNothing = () => () => {};

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/notes/');
  return pathname === href;
}

export default function SiteHeader({ pulse }: Readonly<{ pulse?: IndexPulse | null }>) {
  const pathname = usePathname();
  // The server snapshot is deliberately null. Most routes are statically
  // rendered, so an age resolved on the server would be stamped at build time
  // and then quietly rot; the client resolves it against the reader's clock.
  const age = useSyncExternalStore(
    subscribeToNothing,
    () => relativeAge(pulse?.latestCreatedAt),
    () => null
  );

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
            <ThemeSong />
          </nav>
          <p className={styles.status}>
            <span aria-hidden="true" />
            {pulse
              ? `entry № ${pulse.total.toLocaleString()}${age ? ` logged ${age}` : ''} — `
              : ''}
            the index never closes
          </p>
        </div>
      </div>
    </header>
  );
}

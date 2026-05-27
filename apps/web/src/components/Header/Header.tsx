'use client';

import { useRef } from 'react';
import { FaCode } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSparkles } from '@/hooks/useSparkles';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { num: '01', label: 'Choices', href: '/' },
  { num: '02', label: 'Builds', href: '/projects' },
  { num: '03', label: 'Human', href: '/about' },
] as const;

export default function Header() {
  const pathname = usePathname();
  const rowRef = useRef<HTMLDivElement | null>(null);

  useSparkles({ containerRef: rowRef });

  return (
    <header className={styles.header}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <div className={styles.row} ref={rowRef}>
        <div className={styles.brandArea}>
          <button
            type="button"
            className={styles.glitterTrigger}
            onClick={() => globalThis.dispatchEvent(new Event('trigger-glitter-bomb'))}
            aria-label="Trigger glitter effect"
          >
            <span className={styles.brandMark} aria-hidden="true" />
          </button>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Ashley Childress · System Notes</span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Main Navigation">
          {NAV_ITEMS.map(({ num, label, href }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
            >
              <span className={styles.navNum}>{num}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <a
            href="https://dev.to/anchildress1"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="blog-link"
            className={styles.ctaButton}
          >
            <FaCode size={13} aria-hidden="true" />
            <span>Blog</span>
          </a>
        </div>
      </div>
    </header>
  );
}

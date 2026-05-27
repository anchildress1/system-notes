'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Choices', href: '/' },
  { label: 'Builds', href: '/projects' },
  { label: 'Human', href: '/about' },
] as const;

const PATH_LABEL: Record<string, string> = {
  '/': '/sys/choices',
  '/projects': '/sys/builds',
  '/about': '/sys/human',
  '/search': '/sys/search',
};

export default function Header() {
  const pathname = usePathname();

  const statusPath = PATH_LABEL[pathname] ?? `/sys${pathname}`;

  return (
    <header className={styles.header}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <div className={styles.row}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => globalThis.dispatchEvent(new Event('trigger-glitter-bomb'))}
          aria-label="Trigger glitter effect"
        >
          <div className={styles.brandMark} aria-hidden="true">
            <Image
              src="/favicon.png"
              alt=""
              width={28}
              height={28}
              className={styles.brandMarkImage}
              priority
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Ashley Childress</span>
            <span className={styles.brandSub}>SYS_NOTES · v2.0.26</span>
          </div>
        </button>

        <nav className={styles.nav} aria-label="Main Navigation">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://dev.to/anchildress1"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="blog-link"
            className={styles.navCta}
          >
            <span>$ read --blog</span>
            <span className={styles.navCtaArrow}>↗</span>
          </a>
        </nav>

        <div className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>SYS · {statusPath}</span>
        </div>
      </div>
    </header>
  );
}

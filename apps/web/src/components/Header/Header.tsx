'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Button from '@/components/Button/Button';
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
        <Link href="/" className={styles.brand} aria-label="Ashley Childress, home">
          <div className={styles.brandMark} aria-hidden="true">
            <Image
              src="/system-notes-icon-v2.svg"
              alt=""
              width={28}
              height={28}
              className={styles.brandMarkImage}
              unoptimized
              priority
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Ashley Childress</span>
            <span className={styles.brandSub} aria-hidden="true">
              SYS_NOTES · v2.1.26
            </span>
          </div>
        </Link>

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
          <Button
            variant="secondary"
            size="sm"
            href="https://dev.to/anchildress1"
            target="_blank"
            dataTestId="blog-link"
            className={styles.navCta}
            iconRight={
              <span className={styles.navCtaArrow} aria-hidden="true">
                ↗
              </span>
            }
          >
            $ read --blog
          </Button>
        </nav>

        <div className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>SYS · {statusPath}</span>
        </div>
      </div>
    </header>
  );
}

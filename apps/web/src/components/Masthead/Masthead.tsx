'use client';

import { usePathname } from 'next/navigation';
import styles from './Masthead.module.css';

const CWD_MAP: Record<string, string> = {
  '/': '/SYS/CHOICES',
  '/projects': '/SYS/BUILDS',
  '/about': '/SYS/HUMAN',
  '/search': '/SYS/SEARCH',
};

function useLiveDate(): string {
  if (typeof window === 'undefined') return '';
  return new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

export default function Masthead() {
  const pathname = usePathname();
  const cwd = CWD_MAP[pathname] ?? `/SYS${pathname.toUpperCase()}`;
  const date = useLiveDate();

  return (
    <div className={styles.masthead} role="complementary" aria-label="Site status bar">
      <div className={styles.left}>
        <span className={styles.pulseDot} aria-hidden="true" />
        <span>
          EDITION <strong>02.028</strong>
          {' · '}
          <span suppressHydrationWarning>{date}</span>
        </span>
      </div>
      <div className={styles.center}>
        CWD · <strong>{cwd}</strong>
      </div>
      <div className={styles.right}>
        An <strong>indexed</strong>, not imagined, portfolio.
      </div>
    </div>
  );
}

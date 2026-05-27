'use client';

import { memo } from 'react';
import { SiAlgolia } from 'react-icons/si';
import Link from 'next/link';
import styles from './Footer.module.css';

const currentYear = new Date().getFullYear();

export default memo(function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.col}>
            <div className={styles.colLabel}>/ index</div>
            <div className={styles.brand}>
              <span className={styles.brandDot} aria-hidden="true" />
              <span className={styles.brandName}>ASHLEY&apos;S SYSTEM NOTES</span>
            </div>
            <p className={styles.blurb}>
              A retrieval-first portfolio. The site is the artifact; the <em>system</em> is the
              work. Built with GitHub Copilot, ChatGPT, Verdent, Claude + Gemini.
            </p>
          </div>

          <div className={styles.col}>
            <div className={styles.colLabel}>/ surfaces</div>
            <div className={styles.stack}>
              <Link href="/" className={styles.link}>
                → /sys/choices
              </Link>
              <Link href="/projects" className={styles.link}>
                → /sys/builds
              </Link>
              <Link href="/about" className={styles.link}>
                → /sys/human
              </Link>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                → /sys/blog ↗
              </a>
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.colLabel}>/ contact</div>
            <div className={styles.stack}>
              <a
                href="https://github.com/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my GitHub profile"
              >
                → github
              </a>
              <a
                href="https://linkedin.com/in/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my LinkedIn profile"
              >
                → linkedin
              </a>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my Dev.to profile"
              >
                → dev.to
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span suppressHydrationWarning>
            {currentYear} · Ashley Childress · Built under human supervision.
          </span>
          <span className={styles.bottomRight}>
            <a
              href="https://www.algolia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="algolia-attribution"
              aria-label="Powered by Algolia"
            >
              <span className="algolia-hoverable">
                <SiAlgolia aria-hidden="true" className="algolia-icon" />
                <span className="algolia-name">Algolia</span>
              </span>
              <span className="algolia-prefix">Powered by</span>
            </a>{' '}
            · SYS_NOTES v2.0.26 · build / break / ship
          </span>
        </div>
      </div>
    </footer>
  );
});

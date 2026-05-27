'use client';

import { memo } from 'react';
import { FaGithub, FaLinkedin, FaDev } from 'react-icons/fa';
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
            <p className={styles.blurb}>
              A retrieval-first portfolio. The site is the artifact; the <em>system</em> is the
              work.
            </p>
          </div>

          <div className={styles.col}>
            <div className={styles.colLabel}>/ surfaces</div>
            <div className={styles.stack}>
              <Link href="/" className={styles.link}>
                Choices
              </Link>
              <Link href="/projects" className={styles.link}>
                Builds
              </Link>
              <Link href="/about" className={styles.link}>
                Human
              </Link>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Blog ↗
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
                <FaGithub aria-hidden="true" size={14} /> GitHub
              </a>
              <a
                href="https://linkedin.com/in/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my LinkedIn profile"
              >
                <FaLinkedin aria-hidden="true" size={14} /> LinkedIn
              </a>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my Dev.to profile"
              >
                <FaDev aria-hidden="true" size={14} /> Dev.to
              </a>
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.colLabel}>/ colophon</div>
            <div className={styles.colophon}>
              <span>Instrument Serif</span>
              <span>JetBrains Mono</span>
              <span>
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
                </a>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span suppressHydrationWarning>
            &copy; {currentYear} · Ashley Childress · All notes preserved
          </span>
          <span>v2.0 · build / break / ship</span>
        </div>
      </div>
    </footer>
  );
});

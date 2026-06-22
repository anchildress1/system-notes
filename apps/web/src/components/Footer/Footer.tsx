'use client';

import { memo } from 'react';
import { FaGithub, FaLinkedin, FaDev } from 'react-icons/fa';
import { FiTerminal, FiCode, FiUser, FiExternalLink } from 'react-icons/fi';
import { SiAlgolia } from 'react-icons/si';
import Link from 'next/link';
import Kicker from '@/components/Kicker/Kicker';
import styles from './Footer.module.css';

const currentYear = new Date().getFullYear();

export default memo(function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.col}>
            <Kicker tone="dim" dot={false} className={styles.colLabel}>
              / index
            </Kicker>
            <div className={styles.brand}>
              <span className={styles.brandDot} aria-hidden="true" />
              <span className={styles.brandName}>ASHLEY&apos;S SYSTEM NOTES</span>
            </div>
            <p className={styles.blurb}>
              A retrieval-first portfolio. The site is the artifact; the <em>system</em> is the
              work.
            </p>
          </div>

          <div className={styles.col}>
            <Kicker tone="dim" dot={false} className={styles.colLabel}>
              / surfaces
            </Kicker>
            <div className={styles.stack}>
              <Link href="/" className={styles.link}>
                <FiTerminal aria-hidden="true" size={12} /> /sys/choices
              </Link>
              <Link href="/projects" className={styles.link}>
                <FiCode aria-hidden="true" size={12} /> /sys/builds
              </Link>
              <Link href="/about" className={styles.link}>
                <FiUser aria-hidden="true" size={12} /> /sys/human
              </Link>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <FiExternalLink aria-hidden="true" size={12} /> /sys/blog
              </a>
            </div>
          </div>

          <div className={styles.col}>
            <Kicker tone="dim" dot={false} className={styles.colLabel}>
              / contact
            </Kicker>
            <div className={styles.stack}>
              <a
                href="https://github.com/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my GitHub profile"
              >
                <FaGithub aria-hidden="true" size={13} /> github
              </a>
              <a
                href="https://linkedin.com/in/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my LinkedIn profile"
              >
                <FaLinkedin aria-hidden="true" size={13} /> linkedin
              </a>
              <a
                href="https://dev.to/anchildress1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label="Visit my Dev.to profile"
              >
                <FaDev aria-hidden="true" size={13} /> dev.to
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span suppressHydrationWarning>{currentYear} · Ashley Childress</span>
          <span className={styles.bottomRight}>
            <a
              href="https://www.algolia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="algolia-attribution"
            >
              <span className="algolia-prefix">Powered by</span>
              <span className="algolia-hoverable">
                <SiAlgolia aria-hidden="true" className="algolia-icon" />
                <span className="algolia-name">Algolia</span>
              </span>
            </a>{' '}
            · SYS_NOTES v2.1.26 · build / break / ship
          </span>
        </div>
      </div>
    </footer>
  );
});

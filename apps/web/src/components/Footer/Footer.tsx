'use client';

import Link from 'next/link';
import { FaGithub, FaLinkedin, FaDev } from 'react-icons/fa';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <span suppressHydrationWarning>&copy; {currentYear} Ashley Childress</span>
        <Link href="/sitemap" className={styles.link}>
          Sitemap
        </Link>
      </div>
      <div className={styles.center}>
        <span className={styles.builtWith}>
          Built with Gemini 3 Pro + Antigravity
          <br />
          (plus a little help from ChatGPT) 🦄
        </span>
      </div>
      <div className={styles.right}>
        <a
          href="https://github.com/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit my GitHub profile"
        >
          <FaGithub aria-hidden="true" />
        </a>
        <a
          href="https://linkedin.com/in/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit my LinkedIn profile"
        >
          <FaLinkedin aria-hidden="true" />
        </a>
        <a
          href="https://dev.to/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit my Dev.to profile"
        >
          <FaDev aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}

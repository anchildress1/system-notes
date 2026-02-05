'use client';

import { FaGithub, FaLinkedin, FaDev } from 'react-icons/fa';
import { SiAlgolia } from 'react-icons/si';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <span suppressHydrationWarning>&copy; {currentYear} Ashley Childress</span>
      </div>
      <div className={styles.center}>
        <div className={styles.poweredBy}>
          <span className={styles.builtWith}>Built with Gemini, ChatGPT, Claude + Verdent</span>
          <a
            href="https://www.algolia.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.algoliaLink}
            aria-label="Powered by Algolia"
          >
            <span>Search by</span>
            <SiAlgolia aria-hidden="true" className={styles.algoliaIcon} />
            <span>Algolia</span>
          </a>
        </div>
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

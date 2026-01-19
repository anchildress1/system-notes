'use client';

import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <span suppressHydrationWarning>&copy; {currentYear} Ashley Childress</span>
      </div>
      <div className={styles.center}>
        <span className={styles.builtWith}>
          Built with Gemini 3 Pro + Antigravity<br />(plus a little help from ChatGPT) 🦄
        </span>
      </div>
      <div className={styles.right}>
        <a
          href="https://github.com/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          LinkedIn
        </a>
        <a
          href="https://dev.to/anchildress1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Follow me on Dev.to
        </a>
      </div>
    </footer>
  );
}

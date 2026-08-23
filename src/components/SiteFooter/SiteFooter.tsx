import styles from './SiteFooter.module.css';

const links = [
  { label: 'GitHub', href: 'https://github.com/anchildress1' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/anchildress1' },
  { label: 'DEV', href: 'https://dev.to/anchildress1' },
] as const;

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.byline}>
          Ashley Childress · systems, software, and the proof behind both.
        </p>
        <nav className={styles.links} aria-label="External links">
          {links.map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer">
              {label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

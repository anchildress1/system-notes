import { profile } from '@/data/profile';
import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.byline}>
          Ashley Childress · systems, software, and the proof behind both.
        </p>
        <nav className={styles.links} aria-label="External links">
          {profile.links.map(({ label, href }) => (
            <a key={href} className="swiped" href={href} target="_blank" rel="noopener noreferrer">
              {label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

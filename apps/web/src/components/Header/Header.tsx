import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <h1 className={styles.name}>System Notes</h1>
        <span className={styles.handle}>v1.0</span>
      </div>

      <nav className={styles.nav}>
        <div className={`${styles.navItem} ${styles.active}`}>Projects</div>
        <div className={styles.navItem} style={{ opacity: 0.3, cursor: 'not-allowed' }}>
          Gallery (coming soon)
        </div>
      </nav>
    </header>
  );
}

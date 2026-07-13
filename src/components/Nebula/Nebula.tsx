import styles from './Nebula.module.css';

export default function Nebula() {
  return (
    <div className={styles.nebula} aria-hidden="true" data-testid="nebula">
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  );
}

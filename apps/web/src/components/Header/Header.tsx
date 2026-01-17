import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.identity}>
                <h1 className={styles.name}>Ashley Childress</h1>
                <span className={styles.handle}>@anchildress1</span>
            </div>

            <div className={styles.systemName}>System Notes v0.1</div>

            {/* 
        Intentionally left mostly empty to "favor whitespace".
        Navigation could go here, but keeping it minimal matches the prompt. 
      */}
        </header>
    );
}

'use client';

import styles from './global-error.module.css';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <html lang="en">
      <body className={styles.errorShell}>
        <p className={styles.errorCode}>SYSTEM / ERROR</p>
        <h1 className={styles.errorHeading}>The failure path works.</h1>
        <p className={styles.errorMessage}>
          {error.digest
            ? `The page stopped with reference ${error.digest}.`
            : 'The page stopped before it could produce a useful result.'}
        </p>
        <button type="button" className={styles.errorAction} onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}

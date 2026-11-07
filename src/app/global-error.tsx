'use client';

import styles from './global-error.module.css';

export default function GlobalError({
  error,
  retry,
}: Readonly<{
  error: unknown;
  retry: () => void;
}>) {
  // A value thrown in a Client Component arrives as-is and may not be an Error.
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <html lang="en">
      <body className={styles.errorShell}>
        <h1 className={styles.errorHeading}>The failure path works.</h1>
        <p className={styles.errorMessage}>
          {digest
            ? `The page stopped with reference ${digest}.`
            : 'The page stopped before it could produce a useful result.'}
        </p>
        <button type="button" className={styles.errorAction} onClick={retry}>
          Try again
        </button>
      </body>
    </html>
  );
}

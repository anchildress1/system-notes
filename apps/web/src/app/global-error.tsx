'use client';

import Button from '@/components/Button/Button';
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
        <h2 className={styles.errorHeading}>Something went wrong</h2>
        <p className={styles.errorMessage}>
          {error.digest
            ? `An unexpected error occurred (${error.digest}).`
            : 'An unexpected error occurred.'}
        </p>
        <Button
          variant="primary"
          ariaLabel="Try again"
          size="sm"
          className={styles.errorAction}
          onClick={reset}
        >
          Try again
        </Button>
      </body>
    </html>
  );
}

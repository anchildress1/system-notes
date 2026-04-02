'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#000',
          color: '#e5e5e5',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#a3a3a3',
            marginBottom: '1.5rem',
            maxWidth: '32rem',
          }}
        >
          {error.digest
            ? `An unexpected error occurred (${error.digest}).`
            : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            borderRadius: '0.375rem',
            border: '1px solid #404040',
            backgroundColor: '#171717',
            color: '#e5e5e5',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

'use client';

import dynamic from 'next/dynamic';
import styles from './SearchPageWrapper.module.css';

// Enable SSR to prevent layout shifts - Algolia's InstantSearch supports SSR
// IMPORTANT: SearchPage uses browser APIs (document, window, DOM observers) inside useEffect hooks.
// These are safe for SSR because useEffect only runs client-side. Any future refactoring must
// ensure all browser API usage remains inside useEffect to maintain SSR compatibility.
const SearchPage = dynamic(() => import('./SearchPage'), {
  ssr: true,
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>Loading search...</div>
    </div>
  ),
});

export default function SearchPageWrapper() {
  return <SearchPage />;
}

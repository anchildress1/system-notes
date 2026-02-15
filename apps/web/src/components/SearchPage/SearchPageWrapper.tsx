'use client';

import dynamic from 'next/dynamic';
import styles from './SearchPageWrapper.module.css';

// Lazy load SearchPage to reduce initial bundle size and improve performance.
// The search functionality is below the fold and not immediately needed for FCP/LCP.
// This defers loading all Algolia dependencies until the component is in view.
const SearchPage = dynamic(() => import('./SearchPage'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>Loading search...</div>
    </div>
  ),
});

export default function SearchPageWrapper() {
  return <SearchPage />;
}

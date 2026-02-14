'use client';

import dynamic from 'next/dynamic';
import styles from './SearchPageWrapper.module.css';

// Enable SSR to prevent layout shifts - Algolia's InstantSearch supports SSR
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
